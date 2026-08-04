const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;

if (connectionString && !connectionString.includes('sslmode=')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
}

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'chit_restaurant',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '3846',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

pool.query(`
  ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50),
  ADD COLUMN IF NOT EXISTS waiting_token VARCHAR(50);

  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
  ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('dine_in', 'takeaway', 'online', 'delivery'));

  ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_status_check;
  ALTER TABLE tables ADD CONSTRAINT tables_status_check CHECK (status IN ('free', 'occupied', 'reserved'));

  CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    party_size INTEGER NOT NULL DEFAULT 2,
    reservation_time TIMESTAMP NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS waiter_punches (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    punch_in TIMESTAMP NOT NULL DEFAULT NOW(),
    punch_out TIMESTAMP,
    last_active TIMESTAMP DEFAULT NOW(),
    total_minutes INTEGER DEFAULT 0
  );
`).then(() => {
  console.log('✓ Database schema auto-verified: reservations, punches, and constraints ready.');
}).catch((err) => {
  console.warn('Column auto-migration warning:', err.message);
});

module.exports = pool;
