export default function Confirmation({ show, order, onClose }) {
  if (!show || !order) return null;
  return (
    <div className="modal-overlay show">
      <div className="modal-box pop" style={{ textAlign: 'center' }}>
        <div className="check-wrap">
          <svg viewBox="0 0 66 66">
            <circle className="check-circle" cx="33" cy="33" r="28" />
            <path className="check-mark" d="M20 34 L29 43 L47 23" />
          </svg>
        </div>
        <h2>Order placed!</h2>
        <p className="sub">We've sent it straight to the kitchen.</p>
        <div className="confirmation-order-id">Order #{order.id}</div>
        <p className="sub">
          {order.table_id
            ? "We'll bring it right to your table."
            : "We'll have it ready for pickup shortly."}
        </p>
        <button className="checkout-btn" onClick={onClose}>Back to menu</button>
      </div>
    </div>
  );
}
