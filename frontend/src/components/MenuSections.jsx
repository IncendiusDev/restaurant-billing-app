import { useEffect, useRef, useState } from 'react';

function money(n) {
  return `₹${Number(n).toFixed(2)}`;
}

function useReveal() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.unobserve(node); } },
      { threshold: 0.1 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function ItemCard({ item, qty, onAdd, onInc, onDec }) {
  const [ref, inView] = useReveal();
  const [bump, setBump] = useState(false);

  function handleAdd() {
    setBump(true);
    setTimeout(() => setBump(false), 300);
    onAdd();
  }

  return (
    <div ref={ref} className={`item-card reveal ${inView ? 'in' : ''}`}>
      <div className="item-name">{item.name}</div>
      <div className="item-desc">{item.description || ''}</div>
      <div className="item-footer">
        <div className="item-price">{money(item.price)}</div>
        {qty > 0 ? (
          <div className="qty-stepper">
            <button onClick={onDec}>−</button>
            <span className={bump ? 'pop' : ''}>{qty}</span>
            <button onClick={() => { setBump(true); setTimeout(() => setBump(false), 200); onInc(); }}>+</button>
          </div>
        ) : (
          <button className={`add-btn ${bump ? 'bump' : ''}`} onClick={handleAdd}>Add</button>
        )}
      </div>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="menu-grid">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}
    </div>
  );
}

export default function MenuSections({ groupedItems, cart, onAdd, onInc, onDec }) {
  const categories = Object.keys(groupedItems);
  if (!categories.length) {
    return <div className="empty-state">No dishes match your search.</div>;
  }
  return (
    <div>
      {categories.map((cat) => (
        <section className="menu-section" id={`cat-${cat}`} key={cat}>
          <h2 className="menu-section-title">{cat}</h2>
          <div className="menu-grid">
            {groupedItems[cat].map((item) => {
              const line = cart[item.id];
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  qty={line ? line.qty : 0}
                  onAdd={() => onAdd(item)}
                  onInc={() => onInc(item)}
                  onDec={() => onDec(item)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
