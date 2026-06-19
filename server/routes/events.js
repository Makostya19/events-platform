const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM events';
    const params = [];
    if (category) {
      params.push(category);
      query += ` WHERE category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += params.length === 1 ? ' WHERE' : ' AND';
      query += ` title ILIKE $${params.length}`;
    }
    query += ' ORDER BY event_date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { title, description, category, location, event_date, price, total_seats, image_url } = req.body;
    const result = await pool.query(
      'INSERT INTO events (title, description, category, location, event_date, price, total_seats, available_seats, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8) RETURNING *',
      [title, description, category, location, event_date, price, total_seats, image_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;