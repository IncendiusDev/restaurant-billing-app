const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function seedNeonUsers() {
  console.log('Seeding Neon database users table...');
  try {
    const hash = await bcrypt.hash('123456', 10);

    // 1. Insert Restaurant 1
    await pool.query(`
      INSERT INTO restaurants (id, name, slug, address, phone, email) 
      VALUES (1, 'Spice Garden Restaurant', 'spice-garden', '123 Food Street, Downtown', '+91 98765 43210', 'admin@spicegarden.com')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Insert Admin Account
    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (1, 1, 'Restaurant Admin', 'admin@spicegarden.com', $1, 'restaurant_admin', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    // 3. Insert Waiter Subham
    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (5, 1, 'Subham Waiter', 'subham@chit.com', $1, 'waiter', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    // 4. Insert Waiter Vinaya
    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (6, 1, 'Vinaya Waiter', 'vinaya@chit.com', $1, 'waiter', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    console.log('✓ Neon database users table successfully seeded!');
  } catch (err) {
    console.error('Seeding Neon users failed:', err);
  } finally {
    await pool.end();
  }
}

seedNeonUsers();
