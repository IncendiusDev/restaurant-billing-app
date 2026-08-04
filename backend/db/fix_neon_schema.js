const pool = require('./pool');

async function fixNeonSchema() {
  console.log('Adding customer_mobile and waiting_token columns to Neon database...');
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(20),
      ADD COLUMN IF NOT EXISTS waiting_token VARCHAR(20);
    `);
    console.log('✓ Successfully added customer_mobile and waiting_token columns to orders table!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

fixNeonSchema();
