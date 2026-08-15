const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: AdminUsers
 *   description: Admin-only user management
 */

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
};

const usersQuerySchema = {
  page: { type: 'positiveInt', default: 1 },
  limit: { type: 'positiveInt', default: 20 },
  search: { type: 'string', maxLength: 200 },
};

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with pagination and search (Admin only)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Searches by name or email
 *     responses:
 *       200:
 *         description: List of users with pagination
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admins only
 */
router.get('/', authMiddleware, adminOnly, validateQuery(usersQuerySchema), async (req, res) => {
  try {
    const { page, limit, search } = req.validatedQuery;
    const pageNum = page;
    const limitNum = Math.min(100, limit);
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

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Block or activate a user (Admin only)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, blocked]
 *     responses:
 *       200:
 *         description: User status updated
 *       400:
 *         description: Invalid status, or attempting to block your own account
 *       403:
 *         description: Admins only
 *       404:
 *         description: User not found
 */
router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    if (parseInt(req.params.id) === req.user.id && status === 'blocked') {
      return res.status(400).json({ error: 'You cannot block your own account' });
    }

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