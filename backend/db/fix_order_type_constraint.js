const pool = require('./pool');

async function fixOrderTypeConstraint() {
  console.log('Fixing orders_order_type_check constraint on database...');
  try {
    // 1. Drop old constraint
    await pool.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;`);
    
    // 2. Add updated constraint allowing takeaway and delivery
    await pool.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_order_type_check 
      CHECK (order_type IN ('dine_in', 'takeaway', 'online', 'delivery'));
    `);
    
    console.log('✓ Successfully updated orders_order_type_check constraint!');
  } catch (err) {
    console.error('Constraint update error:', err);
  } finally {
    await pool.end();
  }
}

fixOrderTypeConstraint();
