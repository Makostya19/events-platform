const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("UPDATE users SET role='admin' WHERE email='admin@events.com'")
  .then(r => { console.log('Done:', r.rowCount); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });