const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: User favorites
 */

/**
 * @swagger
 * /api/favorites/{event_id}:
 *   post:
 *     summary: Add event to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Added to favorites
 */
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

/**
 * @swagger
 * /api/favorites/{event_id}:
 *   delete:
 *     summary: Remove event from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Removed from favorites
 */
router.delete('/:event_id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND event_id = $2', [req.user.id, req.params.event_id]);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/favorites/my:
 *   get:
 *     summary: Get current user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite events
 */
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