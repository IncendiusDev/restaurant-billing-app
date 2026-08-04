import { useState } from 'react';

export default function CheckoutModal({ show, onClose, onSubmit, submitting, error }) {
  const [name, setName] = useState('');
  const [orderType, setOrderType] = useState('pickup'); // 'pickup' | 'table'
  const [tableNumber, setTableNumber] = useState('');

  if (!show) return null;

  const canSubmit = name.trim() && (orderType === 'pickup' || tableNumber.trim());

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`}>
      <div className="modal-box">
        <h2>Almost there</h2>
        <p className="sub">Just a couple of details and we'll send this to the kitchen.</p>

        <div className="field">
          <label>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
        </div>

        <div className="field">
          <label>How would you like it?</label>
          <div className="order-type-toggle">
            <button
              type="button"
              className={orderType === 'pickup' ? 'active' : ''}
              onClick={() => setOrderType('pickup')}
            >
              Pickup / Online
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
            onClick={() => onSubmit({ customerName: name.trim(), tableNumber: orderType === 'table' ? tableNumber.trim() : null })}
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </div>
    </div>
  );
}
