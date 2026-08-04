const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  console.log('Resetting production user passwords to 123456...');
  try {
    const hash = await bcrypt.hash('123456', 10);
    
    // Ensure Restaurant 1 exists
    await pool.query(`
      INSERT INTO restaurants (id, name, slug, address, phone, email) 
      VALUES (1, 'Spice Garden Restaurant', 'spice-garden', '123 Food Street, Downtown', '+91 98765 43210', 'admin@spicegarden.com')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Reset/Insert Admin Account
    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (1, 1, 'Restaurant Admin', 'admin@spicegarden.com', $1, 'restaurant_admin', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    // Reset/Insert Waiter Subham
    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (5, 1, 'Subham Waiter', 'subham@chit.com', $1, 'waiter', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    // Reset/Insert Waiter Vinaya
    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (6, 1, 'Vinaya Waiter', 'vinaya@chit.com', $1, 'waiter', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    console.log('✓ All user passwords successfully reset to 123456!');
  } catch (err) {
    console.error('Password reset failed:', err);
  } finally {
    await pool.end();
  }
}

resetPasswords();
