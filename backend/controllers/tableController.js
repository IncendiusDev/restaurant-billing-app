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

async function listReservations(req, res) {
  const { rows } = await pool.query(
    `SELECT r.*, t.table_number 
     FROM reservations r 
     LEFT JOIN tables t ON r.table_id = t.id 
     WHERE r.restaurant_id = $1 
     ORDER BY r.reservation_time DESC`,
    [req.restaurantId]
  );
  res.json(rows);
}

async function createReservation(req, res) {
  const { tableId, customerName, customerPhone, partySize, reservationTime, notes } = req.body;
  if (!customerName || !customerPhone || !reservationTime) {
    return res.status(400).json({ error: 'customerName, customerPhone, and reservationTime are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resResult = await client.query(
      `INSERT INTO reservations (restaurant_id, table_id, customer_name, customer_phone, party_size, reservation_time, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed') RETURNING *`,
      [req.restaurantId, tableId || null, customerName, customerPhone, partySize || 2, reservationTime, notes || null]
    );

    if (tableId) {
      await client.query(
        `UPDATE tables SET status = 'reserved' WHERE id = $1 AND restaurant_id = $2`,
        [tableId, req.restaurantId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(resResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateReservationStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resResult = await client.query(
      `UPDATE reservations SET status = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING *`,
      [status, id, req.restaurantId]
    );

    if (!resResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const reservation = resResult.rows[0];

    if (reservation.table_id) {
      const newTableStatus = status === 'seated' ? 'occupied' : 'free';
      await client.query(
        `UPDATE tables SET status = $1 WHERE id = $2 AND restaurant_id = $3`,
        [newTableStatus, reservation.table_id, req.restaurantId]
      );
    }

    await client.query('COMMIT');
    res.json(reservation);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listTables,
  createTable,
  updateTableStatus,
  deleteTable,
  listReservations,
  createReservation,
  updateReservationStatus,
};
