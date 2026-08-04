-- ============================================================
-- Chit: Multi-tenant restaurant billing SaaS — schema
-- ============================================================

CREATE TABLE IF NOT EXISTS restaurants (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  slug            VARCHAR(150) UNIQUE NOT NULL,
  address         VARCHAR(255),
  phone           VARCHAR(30),
  email           VARCHAR(150),
  subscription_plan VARCHAR(30) DEFAULT 'trial',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- role: super_admin (no restaurant_id), restaurant_admin, waiter
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('super_admin','restaurant_admin','waiter')),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tables (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number    INTEGER NOT NULL,
  capacity        INTEGER DEFAULT 4,
  status          VARCHAR(20) DEFAULT 'free' CHECK (status IN ('free','occupied','reserved')),
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

CREATE TABLE IF NOT EXISTS categories (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name            VARCHAR(150) NOT NULL,
  price           NUMERIC(10,2) NOT NULL,
  description     TEXT,
  image_url       VARCHAR(255),
  is_available    BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- order_type: dine_in (waiter-taken) or online (customer self-order from website)
-- status: open -> billed -> paid  (or cancelled)
CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id        INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  waiter_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name   VARCHAR(120),
  order_type      VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','online')),
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','billed','paid','cancelled')),
  tax_pct         NUMERIC(5,2) DEFAULT 5,
  discount        NUMERIC(10,2) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  paid_at         TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  name            VARCHAR(150) NOT NULL,   -- snapshot, survives menu edits
  price           NUMERIC(10,2) NOT NULL,  -- snapshot price at time of order
  quantity        INTEGER NOT NULL DEFAULT 1,
  notes           VARCHAR(255)
);

-- Snapshot of the invoice at the moment it's issued, independent of later order edits
CREATE TABLE IF NOT EXISTS invoices (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(30) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  payment_method  VARCHAR(30),
  payment_status  VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid')),
  issued_at       TIMESTAMP DEFAULT NOW(),
  paid_at         TIMESTAMP,
  UNIQUE(restaurant_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_users_restaurant ON users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_restaurant ON invoices(restaurant_id);
