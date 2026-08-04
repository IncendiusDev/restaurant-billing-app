const pool = require('../db/pool');

async function listItems(req, res) {
  const { rows } = await pool.query(
    `SELECT m.*, c.name AS category_name FROM menu_items m
     LEFT JOIN categories c ON c.id = m.category_id
     WHERE m.restaurant_id = $1 ORDER BY m.id`,
    [req.restaurantId]
  );
  res.json(rows);
}

async function createItem(req, res) {
  const { name, price, categoryName, description, imageUrl } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required.' });
  }

  let categoryId = null;
  if (categoryName) {
    const existing = await pool.query(
      'SELECT id FROM categories WHERE restaurant_id = $1 AND name = $2',
      [req.restaurantId, categoryName]
    );
    if (existing.rows.length) {
      categoryId = existing.rows[0].id;
    } else {
      const created = await pool.query(
        'INSERT INTO categories (restaurant_id, name) VALUES ($1, $2) RETURNING id',
        [req.restaurantId, categoryName]
      );
      categoryId = created.rows[0].id;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO menu_items (restaurant_id, category_id, name, price, description, image_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.restaurantId, categoryId, name, price, description || null, imageUrl || null]
  );
  res.status(201).json(rows[0]);
}

async function updateItem(req, res) {
  const { id } = req.params;
  const { name, price, isAvailable, description, imageUrl } = req.body;

  const { rows } = await pool.query(
    `UPDATE menu_items SET
       name = COALESCE($1, name),
       price = COALESCE($2, price),
       is_available = COALESCE($3, is_available),
       description = COALESCE($4, description),
       image_url = COALESCE($5, image_url)
     WHERE id = $6 AND restaurant_id = $7 RETURNING *`,
    [name, price, isAvailable, description, imageUrl, id, req.restaurantId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Menu item not found.' });
  res.json(rows[0]);
}

async function deleteItem(req, res) {
  const { id } = req.params;
  const { rowCount } = await pool.query(
    'DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2',
    [id, req.restaurantId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Menu item not found.' });
  res.status(204).send();
}

module.exports = { listItems, createItem, updateItem, deleteItem };
