import { useState } from 'react';

export default function CheckoutModal({ show, onClose, onSubmit, submitting, error, cartTotal }) {
  const [name, setName] = useState('');
  const [orderType, setOrderType] = useState('pickup'); // 'pickup' | 'table'
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'desk'

  if (!show) return null;

  const canSubmit = name.trim() && (orderType === 'pickup' || tableNumber.trim());

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`}>
      <div className="modal-box">
        <h2>Checkout & Pay</h2>
        <p className="sub">Select how you'd like to pay for your order (Total: ₹{Number(cartTotal || 0).toFixed(2)})</p>

        <div className="field">
          <label>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
        </div>

        <div className="field">
          <label>Order Type</label>
          <div className="order-type-toggle">
            <button
              type="button"
              className={orderType === 'pickup' ? 'active' : ''}
              onClick={() => setOrderType('pickup')}
            >
              Takeaway / Pickup
            </button>
            <button
              type="button"
              className={orderType === 'table' ? 'active' : ''}
              onClick={() => setOrderType('table')}
            >
              At my table
            </button>
          </div>
        </div>

        {orderType === 'table' && (
          <div className="field">
            <label>Table number</label>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 4"
              type="number"
            />
          </div>
        )}

        <div className="field" style={{ marginTop: '14px' }}>
          <label>Payment Method</label>
          <div className="order-type-toggle">
            <button
              type="button"
              className={paymentMethod === 'online' ? 'active' : ''}
              onClick={() => setPaymentMethod('online')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              💳 Pay Online (UPI / Card)
            </button>
            <button
              type="button"
              className={paymentMethod === 'desk' ? 'active' : ''}
              onClick={() => setPaymentMethod('desk')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              💵 Pay at Desk / Cash
            </button>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button
            className="checkout-btn"
            style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)' }}
            onClick={onClose}
          >
            Back
          </button>
          <button
            className="checkout-btn"
            disabled={!canSubmit || submitting}
            onClick={() => onSubmit({
              customerName: name.trim(),
              tableNumber: orderType === 'table' ? tableNumber.trim() : null,
              paymentMethod
            })}
          >
            {submitting ? 'Processing…' : paymentMethod === 'online' ? 'Pay with Razorpay' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
