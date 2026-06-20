const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { event_id, quantity } = req.body;

    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be greater than 0' });

    const event = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]);
    if (!event.rows.length) return res.status(404).json({ error: 'Event not found' });
    if (event.rows[0].status !== 'published') return res.status(400).json({ error: 'Event is not available for booking' });
    if (event.rows[0].available_seats < quantity) return res.status(400).json({ error: 'Not enough seats available' });

    const total_price = event.rows[0].price * quantity;
    await pool.query('UPDATE events SET available_seats = available_seats - $1 WHERE id = $2', [quantity, event_id]);
    const result = await pool.query(
      `INSERT INTO tickets (user_id, event_id, quantity, total_price, status) VALUES ($1,$2,$3,$4,'confirmed') RETURNING *`,
      [req.user.id, event_id, quantity, total_price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const params = [req.user.id];
    let statusClause = '';
    if (status) {
      params.push(status);
      statusClause = `AND t.status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tickets t WHERE t.user_id = $1 ${statusClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limitNum, offset);
    const result = await pool.query(
      `SELECT t.*, e.title, e.event_date, e.location FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.user_id = $1 ${statusClause}
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ items: result.rows, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const ticket = await pool.query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
    if (!ticket.rows.length) return res.status(404).json({ error: 'Booking not found' });

    const t = ticket.rows[0];
    if (t.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only cancel your own booking' });
    }
    if (t.status === 'cancelled') return res.status(409).json({ error: 'Booking already cancelled' });

    await pool.query('UPDATE tickets SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
    await pool.query('UPDATE events SET available_seats = available_seats + $1 WHERE id = $2', [t.quantity, t.event_id]);

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let statusClause = '';
    if (status) {
      params.push(status);
      statusClause = `WHERE t.status = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM tickets t ${statusClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limitNum, offset);
    const result = await pool.query(
      `SELECT t.*, e.title as event_title, u.name as user_name, u.email as user_email
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN users u ON t.user_id = u.id
       ${statusClause}
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ items: result.rows, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;