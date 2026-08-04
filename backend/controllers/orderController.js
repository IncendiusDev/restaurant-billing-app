const pool = require('../db/pool');

async function attachItems(order) {
  const { rows } = await pool.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [order.id]);
  order.items = rows;
  return order;
}

function computeTotals(order) {
  const subtotal = order.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
  const discount = Number(order.discount) || 0;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * (Number(order.tax_pct) / 100);
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
}

// GET /api/orders?status=open
async function listOrders(req, res) {
  const { status } = req.query;
  const params = [req.restaurantId];
  let sql = 'SELECT * FROM orders WHERE restaurant_id = $1';
  if (status) {
    params.push(status);
    sql += ' AND status = $2';
  }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(sql, params);
  const withItems = await Promise.all(rows.map(attachItems));
  res.json(withItems.map((o) => ({ ...o, totals: computeTotals(o) })));
}

// GET /api/orders/:id
async function getOrder(req, res) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 AND restaurant_id = $2', [
    req.params.id,
    req.restaurantId,
  ]);
  if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
  const order = await attachItems(rows[0]);
  res.json({ ...order, totals: computeTotals(order) });
}

// POST /api/orders
// Waiter creates a dine-in order for a table, OR a customer places an online order (order_type: 'online').
async function createOrder(req, res) {
  const { tableId, customerName, customerMobile, waitingToken, orderType, items, taxPct, discount } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'At least one item is required.' });
  }

  const waiterId = req.user?.role === 'waiter' ? req.user.userId : req.body.waiterId || null;

  const client = await pool.connect();
  try {
    try {
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50),
        ADD COLUMN IF NOT EXISTS waiting_token VARCHAR(50);
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
        ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('dine_in', 'takeaway', 'online', 'delivery'));
      `);
    } catch (colErr) { /* ignore */ }

    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (restaurant_id, table_id, waiter_id, customer_name, customer_mobile, waiting_token, order_type, tax_pct, discount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.restaurantId, tableId || null, waiterId, customerName || null, customerMobile || null, waitingToken || null, orderType || 'dine_in', taxPct ?? 5, discount || 0]
    );
    const order = orderResult.rows[0];

    for (const it of items) {
      const menuItemRes = await client.query(
        'SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2 AND is_available = true',
        [it.menuItemId, req.restaurantId]
      );
      if (!menuItemRes.rows.length) {
        throw new Error(`Menu item ${it.menuItemId} is not available.`);
      }
      const menuItem = menuItemRes.rows[0];
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, menuItem.id, menuItem.name, menuItem.price, it.quantity || 1, it.notes || null]
      );
    }

    if (tableId) {
      await client.query('UPDATE tables SET status = $1 WHERE id = $2 AND restaurant_id = $3', [
        'occupied',
        tableId,
        req.restaurantId,
      ]);
    }

    await client.query('COMMIT');

    const fullOrder = await attachItems(order);
    const io = req.app.get('io');
    if (io) io.to(`restaurant:${req.restaurantId}`).emit('order:new', fullOrder);

    res.status(201).json({ ...fullOrder, totals: computeTotals(fullOrder) });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Could not create order.' });
  } finally {
    client.release();
  }
}

// PATCH /api/orders/:id/items — add, adjust, or remove an item on an open order
async function updateOrderItems(req, res) {
  const { id } = req.params;
  const { add, updateQuantity, removeItemId } = req.body;

  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1 AND restaurant_id = $2 AND status = 'open'", [
    id,
    req.restaurantId,
  ]);
  if (!orderRes.rows.length) return res.status(404).json({ error: 'Open order not found.' });

  if (add) {
    const menuItemRes = await pool.query('SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2', [
      add.menuItemId,
      req.restaurantId,
    ]);
    if (!menuItemRes.rows.length) return res.status(400).json({ error: 'Menu item not found.' });
    const mi = menuItemRes.rows[0];
    await pool.query(
      'INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ($1,$2,$3,$4,$5)',
      [id, mi.id, mi.name, mi.price, add.quantity || 1]
    );
  }
  if (updateQuantity) {
    await pool.query('UPDATE order_items SET quantity = $1 WHERE id = $2 AND order_id = $3', [
      updateQuantity.quantity,
      updateQuantity.orderItemId,
      id,
    ]);
  }
  if (removeItemId) {
    await pool.query('DELETE FROM order_items WHERE id = $1 AND order_id = $2', [removeItemId, id]);
  }

  const updated = await attachItems(orderRes.rows[0]);
  res.json({ ...updated, totals: computeTotals(updated) });
}

// PATCH /api/orders/:id — update discount/tax/customer/status
async function updateOrder(req, res) {
  const { id } = req.params;
  const { discount, taxPct, customerName, status, waiterId } = req.body;

  const { rows } = await pool.query(
    `UPDATE orders SET
       discount = COALESCE($1, discount),
       tax_pct = COALESCE($2, tax_pct),
       customer_name = COALESCE($3, customer_name),
       status = COALESCE($4, status),
       waiter_id = COALESCE($5, waiter_id),
       paid_at = CASE WHEN $4 = 'paid' THEN NOW() ELSE paid_at END
     WHERE id = $6 AND restaurant_id = $7 RETURNING *`,
    [discount, taxPct, customerName, status, waiterId, id, req.restaurantId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Order not found.' });

  if (status === 'paid') {
    const order = rows[0];
    if (order.table_id) {
      await pool.query('UPDATE tables SET status = $1 WHERE id = $2', ['free', order.table_id]);
    }
  }

  const updated = await attachItems(rows[0]);
  res.json({ ...updated, totals: computeTotals(updated) });
}

module.exports = { listOrders, getOrder, createOrder, updateOrderItems, updateOrder, computeTotals, attachItems };
