const pool = require('./db');

async function listUsers() {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users');
    console.log(result.rows);
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}

listUsers();