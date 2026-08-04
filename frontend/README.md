# Chit — Public Restaurant Website

Customer-facing menu + online ordering site. Talks to the backend's public
(no-login) endpoints: `GET /api/public/:slug/menu` and `POST /api/public/:slug/orders`.

## Setup

Make sure the backend is already running (see the backend README) and that
you've added at least one menu item and one table via the admin panel or API,
for the restaurant whose `slug` you'll use below.

```bash
cd website
npm install
cp .env.example .env
```

Edit `.env`:
- `VITE_API_BASE` — where your backend is running (default `http://localhost:4000`)
- `VITE_RESTAURANT_SLUG` — the restaurant's slug (the one you used in
  `register-restaurant`, e.g. `spice-garden`)

Run it:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## How ordering works

- Customers browse the menu, add items to the cart, and check out with their name.
- **"At my table"** — they enter their table number (matches a table already created
  in the admin panel); the order is linked to that table, same as a waiter-taken order.
- **"Pickup / Online"** — no table needed; it's created as a standalone online order.
- Either way, the order lands in the restaurant's **Orders** list in the admin panel
  in real time (same orders table waiters and admins see) and can be invoiced normally.

## Multi-restaurant note

This site is built per-restaurant (one `VITE_RESTAURANT_SLUG` per deployment) — for a
real multi-tenant rollout you'd deploy one instance per restaurant (or extend the app
to read the slug from the URL path, e.g. `yoursite.com/r/:slug`, and fetch accordingly).
