const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Add review
router.post('/:event_id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const result = await pool.query(
      'INSERT INTO reviews (user_id, event_id, rating, comment) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, event_id) DO UPDATE SET rating=$3, comment=$4 RETURNING *',
      [req.user.id, req.params.event_id, rating, comment]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reviews for event
router.get('/:event_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.event_id = $1 ORDER BY r.created_at DESC',
      [req.params.event_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;