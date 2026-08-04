const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://restaurant-billing-app-kp1p.onrender.com');
const SLUG = import.meta.env.VITE_RESTAURANT_SLUG || 'spice-garden';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/api/public/${SLUG}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export function getMenu() {
  return request('/menu').then((data) => {
    // Tolerate a backend that returns a bare array of items instead of { restaurant, items }
    if (Array.isArray(data)) {
      return { restaurant: null, items: data };
    }
    return { restaurant: data.restaurant || null, items: Array.isArray(data.items) ? data.items : [] };
  });
}

export function placeOrder({ customerName, tableNumber, items }) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify({ customerName, tableNumber, items }),
  });
}

export function getOrderStatus(orderId) {
  return request(`/orders/${orderId}`);
}
