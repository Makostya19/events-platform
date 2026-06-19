const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/reviews', require('./routes/reviews'));

app.get('/', (req, res) => res.send('Events Platform API'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));