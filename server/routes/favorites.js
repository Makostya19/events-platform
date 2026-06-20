const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.post('/:event_id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, event_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.event_id]
    );
    res.json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:event_id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND event_id = $2', [req.user.id, req.params.event_id]);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT e.* FROM favorites f JOIN events e ON f.event_id = e.id WHERE f.user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;