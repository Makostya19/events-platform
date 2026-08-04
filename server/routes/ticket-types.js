const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: TicketTypes
 *   description: Event ticket type management
 */

/**
 * @swagger
 * /api/events/{eventId}/ticket-types:
 *   get:
 *     summary: Get all ticket types for an event
 *     tags: [TicketTypes]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of ticket types
 */
router.get('/events/:eventId/ticket-types', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY price ASC',
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{eventId}/ticket-types:
 *   post:
 *     summary: Create a ticket type for an event (Admin only)
 *     tags: [TicketTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, total_quantity]
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               total_quantity:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ticket type created
 *       403:
 *         description: Admins only
 *       404:
 *         description: Event not found
 */
router.post('/events/:eventId/ticket-types', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    const { name, price, total_quantity, is_active } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (price === undefined || price < 0) return res.status(400).json({ error: 'Price must be 0 or greater' });
    if (!total_quantity || total_quantity < 1) return res.status(400).json({ error: 'Total quantity must be greater than 0' });

    const eventCheck = await pool.query('SELECT id FROM events WHERE id = $1', [req.params.eventId]);
    if (!eventCheck.rows.length) return res.status(404).json({ error: 'Event not found' });

    const result = await pool.query(
      `INSERT INTO ticket_types (event_id, name, price, total_quantity, available_quantity, is_active)
       VALUES ($1, $2, $3, $4, $4, $5) RETURNING *`,
      [req.params.eventId, name.trim(), price, total_quantity, is_active !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/ticket-types/{id}:
 *   put:
 *     summary: Update a ticket type (Admin only)
 *     tags: [TicketTypes]
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
 *         description: Ticket type updated
 *       400:
 *         description: Invalid quantity
 *       403:
 *         description: Admins only
 *       404:
 *         description: Ticket type not found
 */
router.put('/ticket-types/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    const { name, price, total_quantity } = req.body;

    const current = await pool.query('SELECT * FROM ticket_types WHERE id = $1', [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: 'Ticket type not found' });
    const existing = current.rows[0];

    const sold = existing.total_quantity - existing.available_quantity;
    if (total_quantity !== undefined && total_quantity < sold) {
      return res.status(400).json({ error: `Total quantity cannot be less than already sold quantity (${sold})` });
    }

    const newTotal = total_quantity !== undefined ? total_quantity : existing.total_quantity;
    const newAvailable = newTotal - sold;

    const result = await pool.query(
      `UPDATE ticket_types SET name = $1, price = $2, total_quantity = $3, available_quantity = $4
       WHERE id = $5 RETURNING *`,
      [
        name !== undefined ? name.trim() : existing.name,
        price !== undefined ? price : existing.price,
        newTotal,
        newAvailable,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/ticket-types/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a ticket type (Admin only)
 *     tags: [TicketTypes]
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
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Admins only
 *       404:
 *         description: Ticket type not found
 */
router.patch('/ticket-types/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    const { is_active } = req.body;

    const result = await pool.query(
      'UPDATE ticket_types SET is_active = $1 WHERE id = $2 RETURNING *',
      [!!is_active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Ticket type not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/ticket-types/{id}:
 *   delete:
 *     summary: Delete a ticket type (Admin only)
 *     tags: [TicketTypes]
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
 *         description: Ticket type deleted
 *       400:
 *         description: Cannot delete a ticket type with existing bookings
 *       403:
 *         description: Admins only
 */
router.delete('/ticket-types/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    const bookedCheck = await pool.query(
      `SELECT COUNT(*) FROM tickets WHERE ticket_type_id = $1 AND status = 'confirmed'`,
      [req.params.id]
    );
    if (parseInt(bookedCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete a ticket type with existing bookings. Deactivate it instead.' });
    }

    await pool.query('DELETE FROM ticket_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Ticket type deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;