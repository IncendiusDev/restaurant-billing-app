const { Pool } = require('pg');
require('dotenv').config();

// Direct Neon Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_1a2b3c4d@ep-sweet-queen-axd51h91-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function fixNeonOrderType() {
  console.log('Fixing orders_order_type_check constraint on Neon Cloud Database...');
  try {
    await pool.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;`);
    await pool.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_order_type_check 
      CHECK (order_type IN ('dine_in', 'takeaway', 'online', 'delivery'));
    `);
    console.log('✓ Successfully updated orders_order_type_check constraint on Neon Cloud DB!');
  } catch (err) {
    console.error('Neon constraint fix error:', err);
  } finally {
    await pool.end();
  }
}

fixNeonOrderType();
