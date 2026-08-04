const pool = require('../db/pool');
const { attachItems, computeTotals } = require('./orderController');

async function nextInvoiceNumber(restaurantId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM invoices WHERE restaurant_id = $1',
    [restaurantId]
  );
  const seq = rows[0].count + 1;
  return `INV-${String(seq).padStart(5, '0')}`;
}

// POST /api/orders/:id/invoice — generate (or re-fetch) the invoice for an order
async function generateInvoice(req, res) {
  const { id: orderId } = req.params;

  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1 AND restaurant_id = $2', [
    orderId,
    req.restaurantId,
  ]);
  if (!orderRes.rows.length) return res.status(404).json({ error: 'Order not found.' });
  const order = await attachItems(orderRes.rows[0]);
  if (!order.items.length) return res.status(400).json({ error: 'Cannot invoice an order with no items.' });

  const existing = await pool.query('SELECT * FROM invoices WHERE order_id = $1', [orderId]);
  if (existing.rows.length) {
    return res.json(await buildInvoiceResponse(existing.rows[0], order));
  }

  const totals = computeTotals(order);
  const invoiceNumber = await nextInvoiceNumber(req.restaurantId);

  const inserted = await pool.query(
    `INSERT INTO invoices (restaurant_id, order_id, invoice_number, subtotal, discount, tax, total)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.restaurantId, orderId, invoiceNumber, totals.subtotal, totals.discount, totals.tax, totals.total]
  );

  if (order.status === 'open') {
    await pool.query("UPDATE orders SET status = 'billed' WHERE id = $1", [orderId]);
  }

  res.status(201).json(await buildInvoiceResponse(inserted.rows[0], order));
}

// GET /api/invoices/:id
async function getInvoice(req, res) {
  const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1 AND restaurant_id = $2', [
    req.params.id,
    req.restaurantId,
  ]);
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });
  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [rows[0].order_id]);
  const order = await attachItems(orderRes.rows[0]);
  res.json(await buildInvoiceResponse(rows[0], order));
}

// GET /api/invoices
async function listInvoices(req, res) {
  const { rows } = await pool.query(
    'SELECT * FROM invoices WHERE restaurant_id = $1 ORDER BY issued_at DESC',
    [req.restaurantId]
  );
  res.json(rows);
}

// PATCH /api/invoices/:id/pay
async function markPaid(req, res) {
  const { paymentMethod } = req.body;
  const { rows } = await pool.query(
    `UPDATE invoices SET payment_status = 'paid', payment_method = $1, paid_at = NOW()
     WHERE id = $2 AND restaurant_id = $3 RETURNING *`,
    [paymentMethod || 'cash', req.params.id, req.restaurantId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });

  const invoice = rows[0];
  const orderRes = await pool.query(
    `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = $1 RETURNING *`,
    [invoice.order_id]
  );
  const order = orderRes.rows[0];
  if (order.table_id) {
    await pool.query('UPDATE tables SET status = $1 WHERE id = $2', ['free', order.table_id]);
  }

  res.json(invoice);
}

async function buildInvoiceResponse(invoice, order) {
  const restaurantRes = await pool.query('SELECT name, address, phone FROM restaurants WHERE id = $1', [
    invoice.restaurant_id,
  ]);
  return {
    ...invoice,
    order: { id: order.id, tableId: order.table_id, customerName: order.customer_name, items: order.items },
    restaurant: restaurantRes.rows[0],
  };
}

module.exports = { generateInvoice, getInvoice, listInvoices, markPaid };
