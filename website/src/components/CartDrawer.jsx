function money(n) {
  return `₹${Number(n).toFixed(2)}`;
}

export default function CartDrawer({ show, onClose, cart, onInc, onDec, onCheckout }) {
  const lines = Object.values(cart);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  return (
    <>
      <div className={`cart-overlay ${show ? 'show' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${show ? 'show' : ''}`}>
        <div className="cart-head">
          <div className="cart-title">Your order</div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="cart-items">
          {!lines.length && <div className="empty-state">Your cart is empty — add something tasty.</div>}
          {lines.map((line) => (
            <div className="cart-line" key={line.id}>
              <div>
                <div className="cart-line-name">{line.name}</div>
                <div className="cart-line-price">{money(line.price)} × {line.qty}</div>
              </div>
              <div className="qty-stepper">
                <button onClick={() => onDec(line)}>−</button>
                <span>{line.qty}</span>
                <button onClick={() => onInc(line)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-foot">
          <div className="cart-total-row"><span>Total</span><span>{money(total)}</span></div>
          <button className="checkout-btn" disabled={!lines.length} onClick={onCheckout}>
            Checkout
          </button>
        </div>
      </div>
    </>
  );
}
