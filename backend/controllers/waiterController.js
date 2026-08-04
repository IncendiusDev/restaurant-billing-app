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

async function punchIn(req, res) {
  const userId = req.user.userId;
  const { rows } = await pool.query(
    `INSERT INTO waiter_punches (restaurant_id, user_id, punch_in, last_active)
     VALUES ($1, $2, NOW(), NOW()) RETURNING *`,
    [req.restaurantId, userId]
  );
  res.status(201).json(rows[0]);
}

async function punchOut(req, res) {
  const userId = req.user.userId;
  const activePunch = await pool.query(
    `SELECT id, punch_in FROM waiter_punches 
     WHERE restaurant_id = $1 AND user_id = $2 AND punch_out IS NULL 
     ORDER BY punch_in DESC LIMIT 1`,
    [req.restaurantId, userId]
  );
  if (!activePunch.rows.length) {
    return res.status(400).json({ error: 'No active punch-in session found.' });
  }

  const punch = activePunch.rows[0];
  const mins = Math.max(1, Math.floor((Date.now() - new Date(punch.punch_in).getTime()) / 60000));

  const { rows } = await pool.query(
    `UPDATE waiter_punches 
     SET punch_out = NOW(), last_active = NOW(), total_minutes = $1 
     WHERE id = $2 RETURNING *`,
    [mins, punch.id]
  );
  res.json(rows[0]);
}

async function pingActive(req, res) {
  const userId = req.user.userId;
  await pool.query(
    `UPDATE waiter_punches SET last_active = NOW() 
     WHERE id = (SELECT id FROM waiter_punches WHERE restaurant_id = $1 AND user_id = $2 AND punch_out IS NULL ORDER BY punch_in DESC LIMIT 1)`,
    [req.restaurantId, userId]
  );
  res.json({ status: 'ok' });
}

async function getWaiterReports(req, res) {
  const waitersRes = await pool.query(
    `SELECT id, name, email, is_active FROM users 
     WHERE restaurant_id = $1 AND role = 'waiter' ORDER BY name`,
    [req.restaurantId]
  );
  
  const reports = await Promise.all(waitersRes.rows.map(async (w) => {
    const ordersRes = await pool.query(
      `SELECT o.order_type, o.status, i.total 
       FROM orders o 
       LEFT JOIN invoices i ON o.id = i.order_id 
       WHERE o.restaurant_id = $1 AND o.waiter_id = $2`,
      [req.restaurantId, w.id]
    );

    const punchesRes = await pool.query(
      `SELECT punch_in, punch_out, total_minutes, last_active 
       FROM waiter_punches 
       WHERE restaurant_id = $1 AND user_id = $2 
       ORDER BY punch_in DESC LIMIT 30`,
      [req.restaurantId, w.id]
    );

    let dineInOrders = 0;
    let takeawayOrders = 0;
    let totalRevenue = 0;

    ordersRes.rows.forEach((o) => {
      if (o.order_type === 'takeaway') takeawayOrders++;
      else dineInOrders++;
      if (o.total) totalRevenue += Number(o.total);
    });

    const activePunch = punchesRes.rows.find(p => !p.punch_out);
    const totalMins = punchesRes.rows.reduce((sum, p) => sum + (p.total_minutes || 0), 0);

    return {
      waiter: w,
      dineInOrders,
      takeawayOrders,
      totalOrders: dineInOrders + takeawayOrders,
      totalRevenue,
      isPunchedIn: !!activePunch,
      lastActive: activePunch ? activePunch.last_active : (punchesRes.rows[0]?.last_active || null),
      totalHoursActive: (totalMins / 60).toFixed(1),
      recentPunches: punchesRes.rows.slice(0, 5)
    };
  }));

  res.json(reports);
}

module.exports = { listWaiters, createWaiter, updateWaiter, deleteWaiter, punchIn, punchOut, pingActive, getWaiterReports };
