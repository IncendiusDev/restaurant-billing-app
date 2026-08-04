import { useEffect, useState, useMemo, useRef } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import CategoryRail from './components/CategoryRail.jsx';
import MenuSections, { MenuSkeleton } from './components/MenuSections.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import Confirmation from './components/Confirmation.jsx';
import { getMenu, placeOrder } from './api.js';

function money(n) {
  return `₹${Number(n).toFixed(2)}`;
}

export default function App() {
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  function showToast(msg) {
    const id = toastId.current++;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }

  useEffect(() => {
    getMenu()
      .then((data) => {
        const safeItems = Array.isArray(data.items) ? data.items : [];
        if (!data.restaurant || !Array.isArray(data.items)) {
          console.warn('Menu response was missing expected fields:', data);
        }
        setRestaurant(data.restaurant || null);
        setItems(safeItems);
        setActiveCategory(safeItems[0]?.category_name || '');
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    if (!search.trim()) return safeItems;
    const q = search.toLowerCase();
    return safeItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const groupedItems = useMemo(() => {
    const groups = {};
    (filteredItems || []).forEach((item) => {
      const cat = item.category_name || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categories = Object.keys(groupedItems);
  const cartCount = Object.values(cart).reduce((s, l) => s + l.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, l) => s + l.price * l.qty, 0);

  function addToCart(item) {
    setCart((prev) => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], qty: prev[item.id].qty + 1 }
        : { id: item.id, name: item.name, price: item.price, qty: 1 },
    }));
    showToast(`Added ${item.name}`);
  }
  function incItem(item) {
    setCart((prev) => ({ ...prev, [item.id]: { ...prev[item.id], qty: prev[item.id].qty + 1 } }));
  }
  function decItem(item) {
    setCart((prev) => {
      const line = prev[item.id];
      if (!line) return prev;
      if (line.qty <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { ...line, qty: line.qty - 1 } };
    });
  }

  function scrollToCategory(cat) {
    setActiveCategory(cat);
    document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleCheckoutSubmit({ customerName, tableNumber }) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const orderItems = Object.values(cart).map((l) => ({ menuItemId: l.id, quantity: l.qty }));
      const order = await placeOrder({ customerName, tableNumber, items: orderItems });
      setConfirmedOrder(order);
      setCart({});
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="empty-state" style={{ padding: '80px 20px' }}>
        Couldn't load the menu right now ({loadError}). Please refresh, or check back shortly.
      </div>
    );
  }

  return (
    <div>
      <Header restaurantName={restaurant?.name} cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <Hero restaurantName={restaurant?.name} />

      <div className="search-bar">
        <input
          placeholder="Search the menu… (e.g. paneer, naan)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!loading && categories.length > 0 && (
        <CategoryRail categories={categories} active={activeCategory} onSelect={scrollToCategory} />
      )}

      <div className="menu-wrap">
        {loading ? <MenuSkeleton /> : (
          <MenuSections groupedItems={groupedItems} cart={cart} onAdd={addToCart} onInc={incItem} onDec={decItem} />
        )}
      </div>

      {cartCount > 0 && !cartOpen && (
        <div className="mobile-cart-bar show" onClick={() => setCartOpen(true)}>
          <span>{cartCount} item{cartCount > 1 ? 's' : ''} in cart</span>
          <span>{money(cartTotal)} · View cart</span>
        </div>
      )}

      <CartDrawer
        show={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onInc={(l) => incItem(l)}
        onDec={(l) => decItem(l)}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />
      <CheckoutModal
        show={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={handleCheckoutSubmit}
        submitting={submitting}
        error={submitError}
      />
      <Confirmation show={!!confirmedOrder} order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />

      <div id="toast-stack">
        {toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </div>
  );
}
