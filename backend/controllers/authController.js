const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

function signToken(user) {
  return jwt.sign(
    { userId: user.id, restaurantId: user.restaurant_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

// POST /api/auth/register-restaurant
// Onboards a brand-new restaurant + its first admin account in one step.
async function registerRestaurant(req, res) {
  const { restaurantName, slug, adminName, adminEmail, adminPassword } = req.body;
  if (!restaurantName || !slug || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'restaurantName, slug, adminName, adminEmail, adminPassword are all required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingSlug = await client.query('SELECT id FROM restaurants WHERE slug = $1', [slug]);
    if (existingSlug.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'That restaurant slug is already taken.' });
    }

    const restaurantResult = await client.query(
      `INSERT INTO restaurants (name, slug) VALUES ($1, $2) RETURNING *`,
      [restaurantName, slug]
    );
    const restaurant = restaurantResult.rows[0];

    const hash = await bcrypt.hash(adminPassword, 10);
    const userResult = await client.query(
      `INSERT INTO users (restaurant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'restaurant_admin') RETURNING *`,
      [restaurant.id, adminName, adminEmail, hash]
    );

    await client.query('COMMIT');

    const token = signToken(userResult.rows[0]);
    res.status(201).json({ restaurant, token });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That email is already registered.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not create restaurant.' });
  } finally {
    client.release();
  }
}

// POST /api/auth/login
// Used by super_admin, restaurant_admin, and waiter accounts alike.
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurant_id },
  });
}

// POST /api/auth/seed-demo
async function seedDemoAccounts(req, res) {
  try {
    const hash = await bcrypt.hash('123456', 10);

    await pool.query(`
      INSERT INTO restaurants (id, name, slug, address, phone, email) 
      VALUES (1, 'Spice Garden Restaurant', 'spice-garden', '123 Food Street, Downtown', '+91 98765 43210', 'admin@spicegarden.com')
      ON CONFLICT (id) DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (1, 1, 'Restaurant Admin', 'admin@spicegarden.com', $1, 'restaurant_admin', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (5, 1, 'Subham Waiter', 'subham@chit.com', $1, 'waiter', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    await pool.query(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role, is_active)
      VALUES (6, 1, 'Vinaya Waiter', 'vinaya@chit.com', $1, 'waiter', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true;
    `, [hash]);

    for (let i = 1; i <= 10; i++) {
      await pool.query(`
        INSERT INTO tables (restaurant_id, table_number, capacity) VALUES (1, $1, 4)
        ON CONFLICT (restaurant_id, table_number) DO NOTHING;
      `, [i]);
    }

    await pool.query(`
      INSERT INTO menu_items (restaurant_id, name, price, description) VALUES
        (1, 'Paneer Tikka', 220.00, 'Marinated cottage cheese grilled in tandoor'),
        (1, 'Butter Paneer Masala', 280.00, 'Cottage cheese in rich tomato gravy'),
        (1, 'Veg Biryani', 220.00, 'Fragrant basmati rice cooked with fresh veggies'),
        (1, 'Butter Naan', 45.00, 'Traditional flatbread with butter'),
        (1, 'Fresh Lime Soda', 80.00, 'Refreshing citrus soda')
      ON CONFLICT DO NOTHING;
    `);

    res.json({ success: true, message: 'Demo accounts and menu seeded successfully. Login: admin@spicegarden.com / 123456' });
  } catch (err) {
    console.error('Seed demo error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerRestaurant, login, seedDemoAccounts };
