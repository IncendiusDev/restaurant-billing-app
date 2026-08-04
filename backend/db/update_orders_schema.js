const pool = require('./pool');

async function updateSchema() {
  console.log('Updating orders table check constraint & adding mobile/token columns...');
  
  try {
    // 1. Drop old constraint and add updated check constraint supporting takeaway
    await pool.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;`);
    await pool.query(`ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('dine_in','takeaway','online'));`);
    console.log('✓ Updated orders_order_type_check constraint.');

    // 2. Add customer_mobile and waiting_token columns if missing
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(30);`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS waiting_token VARCHAR(30);`);
    console.log('✓ Added customer_mobile & waiting_token columns.');

  } catch (err) {
    console.error('Schema update failed:', err);
  } finally {
    await pool.end();
  }
}

updateSchema();
