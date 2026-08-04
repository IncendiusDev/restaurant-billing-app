const pool = require('./db/pool');

async function testAlterDirect() {
  console.log('Running direct ALTER TABLE on pool...');
  try {
    const res1 = await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50);`);
    console.log('ALTER customer_mobile SUCCESS:', res1);

    const res2 = await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS waiting_token VARCHAR(50);`);
    console.log('ALTER waiting_token SUCCESS:', res2);
  } catch (err) {
    console.error('ALTER DIRECT ERROR:', err);
  } finally {
    await pool.end();
  }
}

testAlterDirect().catch(console.error);
