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

module.exports = { registerRestaurant, login };
