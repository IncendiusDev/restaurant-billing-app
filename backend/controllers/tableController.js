const pool = require('../db/pool');

async function listTables(req, res) {
  const { rows } = await pool.query(
    'SELECT * FROM tables WHERE restaurant_id = $1 ORDER BY table_number',
    [req.restaurantId]
  );
  res.json(rows);
}

async function createTable(req, res) {
  const { tableNumber, capacity } = req.body;
  if (!tableNumber) return res.status(400).json({ error: 'tableNumber is required.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO tables (restaurant_id, table_number, capacity) VALUES ($1, $2, $3) RETURNING *`,
      [req.restaurantId, tableNumber, capacity || 4]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Table ${tableNumber} already exists.` });
    }
    throw err;
  }
}

async function updateTableStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!['free', 'occupied', 'reserved'].includes(status)) {
    return res.status(400).json({ error: "status must be 'free', 'occupied', or 'reserved'." });
  }
  const { rows } = await pool.query(
    'UPDATE tables SET status = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING *',
    [status, id, req.restaurantId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Table not found.' });
  res.json(rows[0]);
}

async function deleteTable(req, res) {
  const { id } = req.params;
  const { rowCount } = await pool.query(
    'DELETE FROM tables WHERE id = $1 AND restaurant_id = $2',
    [id, req.restaurantId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Table not found.' });
  res.status(204).send();
}

module.exports = { listTables, createTable, updateTableStatus, deleteTable };
