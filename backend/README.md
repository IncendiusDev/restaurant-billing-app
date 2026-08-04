# Chit — Restaurant Billing Backend

Multi-tenant REST API for the restaurant billing SaaS: menu, tables, waiters, orders, and invoices,
with every record scoped to a `restaurant_id` so tenants never see each other's data.

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your real PostgreSQL credentials and a random JWT_SECRET
```

Create the database, then run the migration (creates all tables + your first super admin):

```bash
createdb chit_restaurant
npm run migrate
```

Start the server:

```bash
npm run dev      # with auto-reload
# or
npm start
```

Server runs on `http://localhost:4000` by default. Check `GET /health` to confirm it's up.

## 2. Roles

- **super_admin** — platform owner (you). Onboards restaurants, no restaurant of their own.
- **restaurant_admin** — manages one restaurant: menu, tables, waiters, all orders/invoices.
- **waiter** — logs in, takes dine-in orders against tables, bills them.

## 3. Typical flow

1. `POST /api/auth/register-restaurant` — creates a restaurant + its first admin, returns a JWT.
2. Admin logs in via `POST /api/auth/login`, uses the JWT (as `Authorization: Bearer <token>`) to:
   - add menu items (`POST /api/menu`)
   - add tables (`POST /api/tables`)
   - add waiters (`POST /api/waiters`)
3. Waiter logs in, picks a table, and creates an order:
   `POST /api/orders` with `{ tableId, customerName, items: [{ menuItemId, quantity }] }`
4. When the table is ready to pay: `POST /api/orders/:id/invoice` generates the invoice snapshot.
5. `PATCH /api/invoices/:id/pay` marks it paid and frees the table.
6. Online customer orders use the same `POST /api/orders` with `orderType: "online"` and no `tableId`.

## 4. API reference (all routes except auth require `Authorization: Bearer <token>`)

### Auth
| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register-restaurant` | body: `restaurantName, slug, adminName, adminEmail, adminPassword` |
| POST | `/api/auth/login` | body: `email, password` |

### Menu (`restaurant_admin` writes; any role reads)
| Method | Route |
|---|---|
| GET | `/api/menu` |
| POST | `/api/menu` — `{ name, price, categoryName, description, imageUrl }` |
| PATCH | `/api/menu/:id` — any subset of the same fields, plus `isAvailable` |
| DELETE | `/api/menu/:id` |

### Tables
| Method | Route |
|---|---|
| GET | `/api/tables` |
| POST | `/api/tables` (admin) — `{ tableNumber, capacity }` |
| PATCH | `/api/tables/:id/status` (admin/waiter) — `{ status: "free"\|"occupied"\|"reserved" }` |
| DELETE | `/api/tables/:id` (admin) |

### Waiters (admin only)
| Method | Route |
|---|---|
| GET | `/api/waiters` |
| POST | `/api/waiters` — `{ name, email, password }` |
| PATCH | `/api/waiters/:id` — `{ isActive, name }` |
| DELETE | `/api/waiters/:id` |

### Orders
| Method | Route |
|---|---|
| GET | `/api/orders?status=open` |
| GET | `/api/orders/:id` |
| POST | `/api/orders` — `{ tableId, customerName, orderType, taxPct, discount, items:[{menuItemId, quantity, notes}] }` |
| PATCH | `/api/orders/:id/items` — `{ add: {menuItemId, quantity}, updateQuantity: {orderItemId, quantity}, removeItemId }` |
| PATCH | `/api/orders/:id` — `{ discount, taxPct, customerName, status }` |
| POST | `/api/orders/:id/invoice` — generates/returns the invoice for this order |

### Invoices
| Method | Route |
|---|---|
| GET | `/api/invoices` |
| GET | `/api/invoices/:id` |
| PATCH | `/api/invoices/:id/pay` — `{ paymentMethod }`, marks paid + frees the table |

## 5. Realtime (optional, already wired)

Clients connect with Socket.io and emit `join` with their `restaurantId` to receive
`order:new` events the moment a waiter (or the online ordering flow) creates an order —
useful for a kitchen display screen.

## 6. Multi-tenant safety

Every query is filtered by `restaurant_id`, resolved server-side from the JWT
(`middleware/tenant.js`) — a `restaurant_admin` or `waiter` token can never read or write
another restaurant's data, regardless of what IDs are passed in the request body or URL.
