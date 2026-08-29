const bcrypt = require('bcryptjs');
const pool = require('./db');

const NAME = 'Admin';
const EMAIL = 'admin@events.com';
const PASSWORD = 'Admin1234!';

async function createAdmin() {
  try {
    const hash = await bcrypt.hash(PASSWORD, 10);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL]);

    if (existing.rows.length) {
      const result = await pool.query(
        `UPDATE users SET password_hash = $1, role = 'admin', status = 'active' WHERE email = $2
         RETURNING id, name, email, role`,
        [hash, EMAIL]
      );
      console.log('Пользователь уже существовал, обновлён:', result.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES ($1, $2, $3, 'admin', 'active')
         RETURNING id, name, email, role`,
        [NAME, EMAIL, hash]
      );
      console.log('Создан новый админ:', result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}

createAdmin();