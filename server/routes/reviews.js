const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.post('/:event_id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    if (!comment || comment.length < 5) return res.status(400).json({ error: 'Comment must be at least 5 characters' });

    const booking = await pool.query(
      `SELECT * FROM tickets WHERE user_id = $1 AND event_id = $2 AND status = 'confirmed'`,
      [req.user.id, req.params.event_id]
    );
    if (!booking.rows.length) {
      return res.status(403).json({ error: 'You can only review events you have booked' });
    }

    const existing = await pool.query(
      'SELECT * FROM reviews WHERE user_id = $1 AND event_id = $2',
      [req.user.id, req.params.event_id]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'You have already reviewed this event' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (user_id, event_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, req.params.event_id, rating, comment]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating && (rating < 1 || rating > 5)) return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    const review = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (!review.rows.length) return res.status(404).json({ error: 'Review not found' });
    if (review.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own review' });

    const result = await pool.query(
      'UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 RETURNING *',
      [rating, comment, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (!review.rows.length) return res.status(404).json({ error: 'Review not found' });
    if (review.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own review' });
    }
    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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