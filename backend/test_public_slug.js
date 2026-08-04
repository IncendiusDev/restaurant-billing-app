const pool = require('./db/pool');

async function testSlug() {
  const { rows } = await pool.query('SELECT id, name, slug FROM restaurants');
  console.log('RESTAURANTS IN DB:', rows);
  process.exit(0);
}

testSlug().catch(console.error);
