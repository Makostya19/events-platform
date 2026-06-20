const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
};

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let searchClause = '';
    if (search) {
      params.push(`%${search}%`);
      searchClause = `WHERE name ILIKE $${params.length} OR email ILIKE $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM users ${searchClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limitNum, offset);
    const result = await pool.query(
      `SELECT id, name, email, role, status, created_at FROM users ${searchClause}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ items: result.rows, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, role, status',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;