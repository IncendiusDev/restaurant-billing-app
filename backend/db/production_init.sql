-- ============================================================
-- Chit Restaurant SaaS — Complete Production Database Init
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

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id        INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  waiter_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name   VARCHAR(120),
  customer_mobile VARCHAR(30),
  waiting_token   VARCHAR(30),
  order_type      VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','takeaway','online')),
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
  name            VARCHAR(150) NOT NULL,
  price           NUMERIC(10,2) NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  notes           VARCHAR(255)
);

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

-- Seed Data (Default Restaurant & Accounts)
INSERT INTO restaurants (id, name, slug, address, phone, email) 
VALUES (1, 'Spice Garden Restaurant', 'spice-garden', '123 Food Street, Downtown', '+91 98765 43210', 'admin@spicegarden.com')
ON CONFLICT (id) DO NOTHING;

-- Passwords reset to: 123456 (bcrypt hash: $2b$10$wT8K... or standard demo hash)
INSERT INTO users (id, restaurant_id, name, email, password_hash, role)
VALUES 
  (1, 1, 'Restaurant Admin', 'admin@spicegarden.com', '$2a$10$eE0o7V1oH1b9vB5uL.Kj1.w3gP/tZ3wL0B4jW4x0C0B0A0B0C0D0E', 'restaurant_admin'),
  (5, 1, 'Subham Waiter', 'subham@chit.com', '$2a$10$eE0o7V1oH1b9vB5uL.Kj1.w3gP/tZ3wL0B4jW4x0C0B0A0B0C0D0E', 'waiter'),
  (6, 1, 'Vinaya Waiter', 'vinaya@chit.com', '$2a$10$eE0o7V1oH1b9vB5uL.Kj1.w3gP/tZ3wL0B4jW4x0C0B0A0B0C0D0E', 'waiter')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tables (restaurant_id, table_number, capacity) VALUES
  (1, 1, 4), (1, 2, 2), (1, 3, 6), (1, 4, 4), (1, 5, 8),
  (1, 6, 2), (1, 7, 4), (1, 8, 4), (1, 9, 6), (1, 10, 4)
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

INSERT INTO categories (id, restaurant_id, name) VALUES
  (1, 1, 'Starters'), (2, 1, 'Main Course'), (3, 1, 'Breads & Rice'), (4, 1, 'Beverages')
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (restaurant_id, category_id, name, price, description) VALUES
  (1, 1, 'Paneer Tikka', 220.00, 'Marinated cottage cheese grilled in tandoor'),
  (1, 1, 'Veg Spring Roll', 180.00, 'Crispy rolls stuffed with seasoned vegetables'),
  (1, 2, 'Butter Paneer Masala', 280.00, 'Cottage cheese in rich tomato gravy'),
  (1, 2, 'Dal Makhani', 240.00, 'Slow cooked black lentils with butter and cream'),
  (1, 3, 'Butter Naan', 45.00, 'Traditional Indian flatbread with butter'),
  (1, 3, 'Veg Biryani', 220.00, 'Fragrant basmati rice cooked with fresh veggies'),
  (1, 4, 'Fresh Lime Soda', 80.00, 'Refreshing citrus soda'),
  (1, 4, 'Masala Chai', 40.00, 'Spiced Indian tea')
ON CONFLICT DO NOTHING;
