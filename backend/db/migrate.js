const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const pool = require('./pool');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Running schema...');
  await pool.query(schema);
  console.log('Schema applied.');

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (email && password) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (restaurant_id, name, email, password_hash, role)
         VALUES (NULL, 'Platform Owner', $1, $2, 'super_admin')`,
        [email, hash]
      );
      console.log(`Super admin created: ${email}`);
    } else {
      console.log('Super admin already exists, skipping seed.');
    }
  }

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
