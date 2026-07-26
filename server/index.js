const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('./config/passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(passport.initialize());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/profile', require('./routes/profile'));

app.get('/api/stats', async (req, res) => {
  try {
    const pool = require('./db');
    const [ticketsRes, citiesRes] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(quantity), 0) as total FROM tickets WHERE status = 'confirmed'"),
      pool.query("SELECT COUNT(DISTINCT location) as total FROM events WHERE status = 'published'"),
    ]);
    res.json({
      tickets: parseInt(ticketsRes.rows[0].total),
      cities: parseInt(citiesRes.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Events Platform API'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    statusCode: err.status || 500,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));