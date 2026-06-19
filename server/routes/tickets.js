const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Buy ticket
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { event_id, quantity } = req.body;
    const event = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]);
    if (!event.rows.length) return res.status(404).json({ error: 'Event not found' });
    if (event.rows[0].available_seats < quantity) return res.status(400).json({ error: 'Not enough seats' });
    const total_price = event.rows[0].price * quantity;
    await pool.query('UPDATE events SET available_seats = available_seats - $1 WHERE id = $2', [quantity, event_id]);
    const result = await pool.query(
      'INSERT INTO tickets (user_id, event_id, quantity, total_price) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, event_id, quantity, total_price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my tickets
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, e.title, e.event_date, e.location FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;