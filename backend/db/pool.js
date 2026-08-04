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
`).then(() => {
  console.log('✓ Database schema auto-verified: customer_mobile, waiting_token & order_type constraints ready.');
}).catch((err) => {
  console.warn('Column auto-migration warning:', err.message);
});

module.exports = pool;
