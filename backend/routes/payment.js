const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');

// Initialize Razorpay client strictly using environment variables
function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay environment variables RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.');
  }
  return new Razorpay({ key_id, key_secret });
}

// STEP 1: BACKEND - Create Order
// POST /api/payments/create-order
router.post('/create-order', authenticate, resolveTenant, requireTenant, async (req, res) => {
  const { invoiceId, amount } = req.body;

  if (!amount || !invoiceId) {
    return res.status(400).json({ error: 'amount and invoiceId are required.' });
  }

  const amountInPaise = Math.round(Number(amount) * 100);

  // Minimum amount validation: 100 paise (₹1)
  if (isNaN(amountInPaise) || amountInPaise < 100) {
    return res.status(400).json({ error: 'Minimum order amount must be at least 100 paise (₹1).' });
  }

  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `inv_${invoiceId}_${Date.now()}`,
      notes: {
        invoiceId: String(invoiceId),
        restaurantId: String(req.restaurantId),
      },
    };

    const pgOrder = await razorpay.orders.create(options);

    res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: pgOrder.id,
      amount: pgOrder.amount,
      currency: pgOrder.currency,
    });
  } catch (err) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ error: err.message || 'Razorpay API order creation failed.' });
  }
});

// STEP 3: BACKEND - Verify Signature
// POST /api/payments/verify-payment
router.post('/verify-payment', authenticate, resolveTenant, requireTenant, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, paymentMethod } = req.body;

  // Validate required fields for signature verification
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
    return res.status(400).json({ error: 'Missing required parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId).' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay secret key not configured.' });
  }

  // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  // Compare generated signature with razorpay_signature
  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Signature mismatch! Payment verification failed.' });
  }

  // Signature verified! Settle invoice and free table in database
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invRes = await client.query(
      `UPDATE invoices SET payment_status = 'paid', payment_method = $1, paid_at = NOW()
       WHERE id = $2 AND restaurant_id = $3 RETURNING order_id, invoice_number`,
      [paymentMethod || 'online_desk', invoiceId, req.restaurantId]
    );

    if (!invRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const orderId = invRes.rows[0].order_id;
    const orderRes = await client.query(
      `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = $1 AND restaurant_id = $2 RETURNING table_id`,
      [orderId, req.restaurantId]
    );

    if (orderRes.rows[0]?.table_id) {
      await client.query(`UPDATE tables SET status = 'free' WHERE id = $1 AND restaurant_id = $2`, [
        orderRes.rows[0].table_id,
        req.restaurantId,
      ]);
    }

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) io.to(`restaurant:${req.restaurantId}`).emit('order:paid', { invoiceId, orderId });

    res.status(200).json({
      success: true,
      message: 'Payment signature verified and invoice settled successfully!',
      invoiceNumber: invRes.rows[0].invoice_number,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Payment DB settlement error:', err);
    res.status(500).json({ error: 'Failed to settle invoice after signature verification.' });
  } finally {
    client.release();
  }
});

module.exports = router;
