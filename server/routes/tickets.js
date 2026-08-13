const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket booking management
 */

const myBookingsQuerySchema = {
  page: { type: 'positiveInt', default: 1 },
  limit: { type: 'positiveInt', default: 20 },
  status: { type: 'enum', values: ['confirmed', 'cancelled'] },
  sort: { type: 'enum', values: ['created_desc', 'created_asc', 'event_date_asc', 'event_date_desc'], default: 'created_desc' },
};

const adminBookingsQuerySchema = {
  page: { type: 'positiveInt', default: 1 },
  limit: { type: 'positiveInt', default: 20 },
  status: { type: 'enum', values: ['confirmed', 'cancelled'] },
  sort: { type: 'enum', values: ['created_desc', 'created_asc', 'event_date_asc', 'event_date_desc'], default: 'created_desc' },
  search: { type: 'string', maxLength: 200 },
};

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Book a ticket for an event
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticket_type_id, quantity]
 *             properties:
 *               ticket_type_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Ticket booked successfully
 *       400:
 *         description: Not enough seats or event not available
 *       403:
 *         description: Account blocked
 *       404:
 *         description: Ticket type not found
 */
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { ticket_type_id, quantity } = req.body;

    if (!ticket_type_id) return res.status(400).json({ error: 'ticket_type_id is required' });
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be greater than 0' });

    const userCheck = await client.query('SELECT status FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows[0]?.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked. Contact support.' });
    }

    await client.query('BEGIN');

    const ttResult = await client.query(
      `SELECT tt.*, e.status as event_status
       FROM ticket_types tt
       JOIN events e ON tt.event_id = e.id
       WHERE tt.id = $1
       FOR UPDATE OF tt`,
      [ticket_type_id]
    );
    if (!ttResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket type not found' });
    }
    const ticketType = ttResult.rows[0];

    if (ticketType.event_status !== 'published') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Event is not available for booking' });
    }
    if (!ticketType.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This ticket type is not currently available' });
    }
    if (ticketType.available_quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough tickets available for this type' });
    }

    const total_price = ticketType.price * quantity;

    await client.query(
      'UPDATE ticket_types SET available_quantity = available_quantity - $1 WHERE id = $2',
      [quantity, ticket_type_id]
    );
    await client.query(
      'UPDATE events SET available_seats = available_seats - $1 WHERE id = $2',
      [quantity, ticketType.event_id]
    );

    const result = await client.query(
      `INSERT INTO tickets (user_id, event_id, ticket_type_id, quantity, total_price, status)
       VALUES ($1,$2,$3,$4,$5,'confirmed') RETURNING *`,
      [req.user.id, ticketType.event_id, ticket_type_id, quantity, total_price]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/tickets/my:
 *   get:
 *     summary: Get current user's tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_desc, created_asc, event_date_asc, event_date_desc]
 *     responses:
 *       200:
 *         description: List of user tickets with pagination
 *       400:
 *         description: Validation error
 */
router.get('/my', authMiddleware, validateQuery(myBookingsQuerySchema), async (req, res) => {
  try {
    const { page, limit, status, sort } = req.validatedQuery;
    const pageNum = page;
    const limitNum = Math.min(100, limit);
    const offset = (pageNum - 1) * limitNum;

    const params = [req.user.id];
    let statusClause = '';
    if (status) {
      params.push(status);
      statusClause = `AND t.status = $${params.length}`;
    }

    let orderBy = 't.created_at DESC';
    if (sort === 'created_asc') orderBy = 't.created_at ASC';
    else if (sort === 'event_date_asc') orderBy = 'e.starts_at ASC';
    else if (sort === 'event_date_desc') orderBy = 'e.starts_at DESC';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tickets t WHERE t.user_id = $1 ${statusClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limitNum, offset);
    const result = await pool.query(
      `SELECT t.*, e.title, e.starts_at, e.venue, e.city, tt.name as ticket_type_name
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
       WHERE t.user_id = $1 ${statusClause}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ items: result.rows, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking. Not allowed once the event has started.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Event has already started, cancellation no longer allowed
 *       403:
 *         description: Not your booking
 *       409:
 *         description: Already cancelled
 */
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ticket = await client.query(
      `SELECT t.*, e.starts_at FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.id = $1 FOR UPDATE OF t`,
      [req.params.id]
    );
    if (!ticket.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const t = ticket.rows[0];
    if (t.user_id !== req.user.id && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You can only cancel your own booking' });
    }
    if (t.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Booking already cancelled' });
    }
    if (new Date(t.starts_at) <= new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This event has already started. Cancellation is no longer allowed.' });
    }

    await client.query('UPDATE tickets SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
    await client.query('UPDATE events SET available_seats = available_seats + $1 WHERE id = $2', [t.quantity, t.event_id]);
    if (t.ticket_type_id) {
      await client.query('UPDATE ticket_types SET available_quantity = available_quantity + $1 WHERE id = $2', [t.quantity, t.ticket_type_id]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/tickets/admin/all:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_desc, created_asc, event_date_asc, event_date_desc]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Searches by user name, user email, or event title
 *     responses:
 *       200:
 *         description: List of all bookings
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admins only
 */
router.get('/admin/all', authMiddleware, validateQuery(adminBookingsQuerySchema), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { page, limit, status, sort, search } = req.validatedQuery;
    const pageNum = page;
    const limitNum = Math.min(100, limit);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    const conditions = [];
    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR e.title ILIKE $${params.length})`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 't.created_at DESC';
    if (sort === 'created_asc') orderBy = 't.created_at ASC';
    else if (sort === 'event_date_asc') orderBy = 'e.starts_at ASC';
    else if (sort === 'event_date_desc') orderBy = 'e.starts_at DESC';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tickets t JOIN events e ON t.event_id = e.id JOIN users u ON t.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limitNum, offset);
    const result = await pool.query(
      `SELECT t.*, e.title as event_title, e.starts_at as event_starts_at, u.name as user_name, u.email as user_email, tt.name as ticket_type_name
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ items: result.rows, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;