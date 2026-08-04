const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

const eventsQuerySchema = {
  page: { type: 'positiveInt', default: 1 },
  limit: { type: 'positiveInt', default: 12 },
  category: { type: 'enum', values: ['concert', 'conference', 'festival', 'sports'] },
  city: { type: 'string', maxLength: 100 },
  sort: { type: 'enum', values: ['newest', 'date_asc', 'price_asc', 'price_desc', 'rating_desc'], default: 'newest' },
  minPrice: { type: 'number', min: 0 },
  maxPrice: { type: 'number', min: 0 },
  dateFrom: { type: 'date' },
  dateTo: { type: 'date' },
  search: { type: 'string', maxLength: 200 },
};

const ALLOWED_STATUSES = ['draft', 'published', 'cancelled', 'completed'];

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
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, date_asc, price_asc, price_desc, rating_desc]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Filters by ticket type price (lowest active ticket type price)
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of events with pagination
 *       400:
 *         description: Validation error
 */
router.get('/', validateQuery(eventsQuerySchema), async (req, res) => {
  try {
    const {
      page, limit, search, category, status, city,
      dateFrom, dateTo, minPrice, maxPrice, sort
    } = req.validatedQuery;

    const pageNum = page;
    const limitNum = Math.min(100, limit);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    const conditions = [];

    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.role === 'admin') {
          if (status) {
            params.push(status);
            conditions.push(`e.status = $${params.length}`);
          }
        } else {
          params.push('published');
          conditions.push(`e.status = $${params.length}`);
        }
      } catch {
        params.push('published');
        conditions.push(`e.status = $${params.length}`);
      }
    } else {
      params.push('published');
      conditions.push(`e.status = $${params.length}`);
    }

    if (category) {
      params.push(category);
      conditions.push(`e.category = $${params.length}`);
    }
    if (city) {
      params.push(city);
      conditions.push(`e.city ILIKE $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(e.title ILIKE $${params.length} OR e.description ILIKE $${params.length} OR e.venue ILIKE $${params.length} OR e.city ILIKE $${params.length})`);
    }
    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`e.starts_at >= $${params.length}`);
    }
    if (dateTo) {
      params.push(dateTo);
      conditions.push(`e.starts_at <= $${params.length}`);
    }
    // Цена теперь живёт в ticket_types, поэтому фильтр min/max цены проверяет,
    // есть ли у события хотя бы один активный тип билета в нужном диапазоне.
    if (minPrice !== undefined) {
      params.push(minPrice);
      conditions.push(`EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id AND tt.is_active = true AND tt.price >= $${params.length})`);
    }
    if (maxPrice !== undefined) {
      params.push(maxPrice);
      conditions.push(`EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id AND tt.is_active = true AND tt.price <= $${params.length})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'e.starts_at ASC';
    if (sort === 'newest') orderBy = 'e.created_at DESC';
    else if (sort === 'date_asc') orderBy = 'e.starts_at ASC';
    else if (sort === 'price_asc') orderBy = 'min_ticket_price ASC NULLS LAST';
    else if (sort === 'price_desc') orderBy = 'max_ticket_price DESC NULLS LAST';
    else if (sort === 'rating_desc') orderBy = 'avg_rating DESC NULLS LAST';

    const countQuery = `SELECT COUNT(*) FROM events e ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT e.*, 
        COALESCE(AVG(r.rating), 0)::numeric(2,1) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COALESCE(SUM(tt.total_quantity), 0)::int as capacity,
        COALESCE(SUM(tt.available_quantity), 0)::int as seats_left,
        MIN(tt.price) as min_ticket_price,
        MAX(tt.price) as max_ticket_price
      FROM events e
      LEFT JOIN reviews r ON r.event_id = e.id
      LEFT JOIN ticket_types tt ON tt.event_id = e.id AND tt.is_active = true
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
 *         description: Event details with average rating and ticket capacity
 *       404:
 *         description: Event not found
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, 
        COALESCE(AVG(r.rating), 0)::numeric(2,1) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COALESCE(SUM(tt.total_quantity), 0)::int as capacity,
        COALESCE(SUM(tt.available_quantity), 0)::int as seats_left
      FROM events e
      LEFT JOIN reviews r ON r.event_id = e.id
      LEFT JOIN ticket_types tt ON tt.event_id = e.id AND tt.is_active = true
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
 * /api/events/cities:
 *   get:
 *     summary: Get distinct list of cities with published events (for filter dropdown)
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of distinct city names
 */
router.get('/meta/cities', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT city FROM events WHERE status = 'published' AND city IS NOT NULL AND city != '' ORDER BY city ASC`
    );
    res.json(result.rows.map(r => r.city));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (Admin only). Capacity is defined afterwards via ticket types.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, city, venue, startsAt, endsAt]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [concert, conference, festival, sports]
 *               city:
 *                 type: string
 *               venue:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               endsAt:
 *                 type: string
 *                 format: date-time
 *               image_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Event created (as draft or published if allowed)
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admins only
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { title, description, category, city, venue, startsAt, endsAt, image_url, status } = req.body;

    if (!title || title.length < 3) return res.status(400).json({ error: 'Title must be at least 3 characters' });
    if (!description || description.length < 20) return res.status(400).json({ error: 'Description must be at least 20 characters' });
    if (!city) return res.status(400).json({ error: 'City is required' });
    if (!venue) return res.status(400).json({ error: 'Venue is required' });
    if (!startsAt) return res.status(400).json({ error: 'Start date/time is required' });
    if (!endsAt) return res.status(400).json({ error: 'End date/time is required' });
    if (new Date(startsAt) >= new Date(endsAt)) return res.status(400).json({ error: 'Start must be before end' });

    const desiredStatus = status === 'published' ? 'draft' : (status || 'draft');

    const result = await pool.query(
      `INSERT INTO events (title, description, category, city, venue, location, starts_at, ends_at, event_date, price, total_seats, available_seats, image_url, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$5,$6::timestamp,$7::timestamp,$6::timestamp,0,0,0,$8,$9,$10) RETURNING *`,
      [title, description, category, city, venue, startsAt, endsAt, image_url, desiredStatus, req.user.id]
    );

    const created = result.rows[0];
    res.json({
      ...created,
      note: status === 'published' ? 'Event created as draft. Add at least one active ticket type, then publish it.' : undefined,
    });
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
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admins only
 *       404:
 *         description: Event not found
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { title, description, category, city, venue, startsAt, endsAt, image_url } = req.body;

    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ error: 'Start must be before end' });
    }

    const result = await pool.query(
      `UPDATE events SET title=$1, description=$2, category=$3, city=$4, venue=$5, location=$5,
         starts_at=$6::timestamp, ends_at=$7::timestamp, event_date=$6::timestamp, image_url=$8
       WHERE id=$9 RETURNING *`,
      [title, description, category, city, venue, startsAt, endsAt, image_url, req.params.id]
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
 *     summary: Change event status (Admin only), with transition rules
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
 *                 enum: [draft, published, cancelled, completed]
 *               force:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid transition
 *       403:
 *         description: Admins only
 *       404:
 *         description: Event not found
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { status, force } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const eventRes = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!eventRes.rows.length) return res.status(404).json({ error: 'Event not found' });
    const event = eventRes.rows[0];

    if (status === 'published') {
      if (new Date(event.starts_at) <= new Date()) {
        return res.status(400).json({ error: 'Cannot publish an event that starts in the past' });
      }
      const activeTypes = await pool.query(
        'SELECT COUNT(*) FROM ticket_types WHERE event_id = $1 AND is_active = true',
        [req.params.id]
      );
      if (parseInt(activeTypes.rows[0].count) === 0) {
        return res.status(400).json({ error: 'Cannot publish an event with no active ticket types' });
      }
      if (['cancelled', 'completed'].includes(event.status) && !force) {
        return res.status(400).json({ error: 'Moving a cancelled/completed event back to published requires confirmation (force: true)' });
      }
    }

    if (status === 'completed' && new Date(event.ends_at) > new Date() && !force) {
      return res.status(400).json({ error: 'Event has not ended yet. Confirm with force: true to mark it completed anyway.' });
    }

    const result = await pool.query('UPDATE events SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
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