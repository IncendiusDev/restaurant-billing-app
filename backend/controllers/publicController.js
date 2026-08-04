const pool = require('../db/pool');

async function getRestaurantBySlug(slug) {
  const { rows } = await pool.query(
    'SELECT id, name, slug, address, phone FROM restaurants WHERE slug = $1 AND is_active = true',
    [slug]
  );
  return rows[0] || null;
}

// GET /api/public/:slug/menu — the live menu for a restaurant's public page
async function getPublicMenu(req, res) {
  const restaurant = await getRestaurantBySlug(req.params.slug);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.price, m.description, m.image_url, c.name AS category_name
     FROM menu_items m LEFT JOIN categories c ON c.id = m.category_id
     WHERE m.restaurant_id = $1 AND m.is_available = true
     ORDER BY c.name, m.name`,
    [restaurant.id]
  );
  res.json({ restaurant, items: rows });
}

// POST /api/public/:slug/orders — customer places an order directly from the website.
// If tableNumber is given (e.g. a QR code at the table), it's linked to dine-in; otherwise it's a pickup/online order.
async function createPublicOrder(req, res) {
  const restaurant = await getRestaurantBySlug(req.params.slug);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

  const { customerName, tableNumber, items } = req.body;
  if (!customerName || !items || !items.length) {
    return res.status(400).json({ error: 'customerName and at least one item are required.' });
  }

  let tableId = null;
  if (tableNumber) {
    const tableRes = await pool.query('SELECT id FROM tables WHERE restaurant_id = $1 AND table_number = $2', [
      restaurant.id,
      tableNumber,
    ]);
    if (tableRes.rows.length) tableId = tableRes.rows[0].id;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      `INSERT INTO orders (restaurant_id, table_id, customer_name, order_type, status)
       VALUES ($1, $2, $3, 'online', 'open') RETURNING *`,
      [restaurant.id, tableId, customerName]
    );
    const order = orderResult.rows[0];

    for (const it of items) {
      const menuItemRes = await client.query(
        'SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2 AND is_available = true',
        [it.menuItemId, restaurant.id]
      );
      if (!menuItemRes.rows.length) throw new Error(`Item ${it.menuItemId} is unavailable.`);
      const mi = menuItemRes.rows[0];
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ($1,$2,$3,$4,$5)`,
        [order.id, mi.id, mi.name, mi.price, it.quantity || 1]
      );
    }

    if (tableId) {
      await client.query("UPDATE tables SET status = 'occupied' WHERE id = $1", [tableId]);
    }

    await client.query('COMMIT');

    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    const io = req.app.get('io');
    if (io) io.to(`restaurant:${restaurant.id}`).emit('order:new', { ...order, items: itemsRes.rows });

    res.status(201).json({ ...order, items: itemsRes.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Could not place order.' });
  } finally {
    client.release();
  }
}

// GET /api/public/:slug/orders/:id — lets the customer check their order status
async function getPublicOrderStatus(req, res) {
  const restaurant = await getRestaurantBySlug(req.params.slug);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 AND restaurant_id = $2', [
    req.params.id,
    restaurant.id,
  ]);
  if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [rows[0].id]);
  res.json({ ...rows[0], items: itemsRes.rows });
}

module.exports = { getPublicMenu, createPublicOrder, getPublicOrderStatus };
