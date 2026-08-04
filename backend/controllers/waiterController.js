const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function listWaiters(req, res) {
  const { rows } = await pool.query(
    `SELECT id, name, email, is_active, created_at FROM users
     WHERE restaurant_id = $1 AND role = 'waiter' ORDER BY id`,
    [req.restaurantId]
  );
  res.json(rows);
}

async function createWaiter(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required.' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (restaurant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'waiter') RETURNING id, name, email, is_active, created_at`,
      [req.restaurantId, name, email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That email is already in use.' });
    throw err;
  }
}

async function updateWaiter(req, res) {
  const { id } = req.params;
  const { isActive, name } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET is_active = COALESCE($1, is_active), name = COALESCE($2, name)
     WHERE id = $3 AND restaurant_id = $4 AND role = 'waiter'
     RETURNING id, name, email, is_active`,
    [isActive, name, id, req.restaurantId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Waiter not found.' });
  res.json(rows[0]);
}

async function deleteWaiter(req, res) {
  const { id } = req.params;
  const { rowCount } = await pool.query(
    `DELETE FROM users WHERE id = $1 AND restaurant_id = $2 AND role = 'waiter'`,
    [id, req.restaurantId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Waiter not found.' });
  res.status(204).send();
}

module.exports = { listWaiters, createWaiter, updateWaiter, deleteWaiter };
