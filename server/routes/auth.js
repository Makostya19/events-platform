const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const pool = require('../db');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, status',
      [name, email, hash]
    );
    const token = jwt.sign({ id: result.rows[0].id, role: result.rows[0].role }, process.env.JWT_SECRET);
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid email or password' });

    const user = result.rows[0];

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked. Contact support.' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account uses Google login. Please sign in with Google.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  (req, res) => {
    const user = req.user;

    if (user.status === 'blocked') {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=blocked`);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id, name: user.name, email: user.email, role: user.role, status: user.status
    }));
    res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}&user=${userData}`);
  }
);

module.exports = router;