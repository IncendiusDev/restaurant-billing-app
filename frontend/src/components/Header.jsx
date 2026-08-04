import { useEffect, useState } from 'react';

export default function Header({ restaurantName, cartCount, onCartClick }) {
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    function onScroll() { setShrunk(window.scrollY > 40); }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header ${shrunk ? 'shrunk' : ''}`}>
      <div className="site-brand">{restaurantName || 'Spice'} <span>Garden</span></div>
      <button className="cart-btn" onClick={onCartClick}>
        🧾 Cart
        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
      </button>
    </header>
  );
}
