const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events with pagination, search, filters and sorting
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [concert, conference, festival, sports]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, date_asc, price_asc, price_desc, rating_desc]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of events with pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 12, search, category, status,
      dateFrom, dateTo, minPrice, maxPrice, sort = 'newest'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    const conditions = [];

    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.role === 'admin' && status) {
          params.push(status);
          conditions.push(`status = $${params.length}`);
        } else {
          params.push('published');
          conditions.push(`status = $${params.length}`);
        }
      } catch {
        params.push('published');
        conditions.push(`status = $${params.length}`);
      }
    } else {
      params.push('published');
      conditions.push(`status = $${params.length}`);
    }

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length} OR location ILIKE $${params.length})`);
    }
    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`event_date >= $${params.length}`);
    }
    if (dateTo) {
      params.push(dateTo);
      conditions.push(`event_date <= $${params.length}`);
    }
    if (minPrice) {
      params.push(minPrice);
      conditions.push(`price >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(maxPrice);
      conditions.push(`price <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'event_date ASC';
    if (sort === 'newest') orderBy = 'created_at DESC';
    else if (sort === 'date_asc') orderBy = 'event_date ASC';
    else if (sort === 'price_asc') orderBy = 'price ASC';
    else if (sort === 'price_desc') orderBy = 'price DESC';
    else if (sort === 'rating_desc') orderBy = 'avg_rating DESC NULLS LAST';

    const countQuery = `SELECT COUNT(*) FROM events ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT e.*, 
        COALESCE(AVG(r.rating), 0)::numeric(2,1) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM events e
      LEFT JOIN reviews r ON r.event_id = e.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const result = await pool.query(dataQuery, [...params, limitNum, offset]);

    res.json({
      items: result.rows,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event details with average rating
 *       404:
 *         description: Event not found
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, 
        COALESCE(AVG(r.rating), 0)::numeric(2,1) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM events e
      LEFT JOIN reviews r ON r.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, location, event_date, total_seats]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [concert, conference, festival, sports]
 *               location:
 *                 type: string
 *               event_date:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *               total_seats:
 *                 type: integer
 *               image_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Event created
 *       403:
 *         description: Admins only
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { title, description, category, location, event_date, price, total_seats, image_url, status } = req.body;

    if (!title || title.length < 3) return res.status(400).json({ error: 'Title must be at least 3 characters' });
    if (!description || description.length < 20) return res.status(400).json({ error: 'Description must be at least 20 characters' });
    if (!location) return res.status(400).json({ error: 'Location is required' });
    if (!event_date) return res.status(400).json({ error: 'Event date is required' });
    if (price < 0) return res.status(400).json({ error: 'Price must be 0 or greater' });
    if (!total_seats || total_seats < 1) return res.status(400).json({ error: 'Total seats must be greater than 0' });

    const result = await pool.query(
      `INSERT INTO events (title, description, category, location, event_date, price, total_seats, available_seats, image_url, status, created_by, start_datetime, end_datetime)
       VALUES ($1,$2,$3,$4,$5::timestamp,$6,$7,$7,$8,$9,$10,$5::timestamp,$5::timestamp + INTERVAL '3 hours') RETURNING *`,
      [title, description, category, location, event_date, price, total_seats, image_url, status || 'published', req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event (Admin only)
 *     tags: [Events]
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
 *         description: Event updated
 *       403:
 *         description: Admins only
 *       404:
 *         description: Event not found
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { title, description, category, location, event_date, price, total_seats, image_url } = req.body;

    const result = await pool.query(
      `UPDATE events SET title=$1, description=$2, category=$3, location=$4, event_date=$5::timestamp, price=$6, total_seats=$7, image_url=$8
       WHERE id=$9 RETURNING *`,
      [title, description, category, location, event_date, price, total_seats, image_url, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{id}/status:
 *   patch:
 *     summary: Change event status (Admin only)
 *     tags: [Events]
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
 *                 enum: [draft, published, cancelled, archived]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Admins only
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { status } = req.body;
    const allowed = ['draft', 'published', 'cancelled', 'archived'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query('UPDATE events SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event (Admin only)
 *     tags: [Events]
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
 *         description: Event deleted
 *       403:
 *         description: Admins only
 */
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