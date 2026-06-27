const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const googleId = profile.id;

    // Check if user exists by provider_id (returning Google user)
    let result = await pool.query(
      'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
      ['google', googleId]
    );
    if (result.rows.length) {
      return done(null, result.rows[0]);
    }

    // Check if user exists by email
    result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length) {
      // Link Google to existing account
      await pool.query(
        'UPDATE users SET provider = $1, provider_id = $2 WHERE email = $3',
        ['google', googleId, email]
      );
      return done(null, result.rows[0]);
    }

    // Create new user
    const insertResult = await pool.query(
      'INSERT INTO users (name, email, role, provider, provider_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, email, 'user', 'google', googleId]
    );
    return done(null, insertResult.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

module.exports = passport;