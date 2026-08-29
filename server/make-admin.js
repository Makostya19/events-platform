const pool = require('./db');

const EMAIL = 'kma293385@gmail.com';

async function makeAdmin() {
  try {
    const result = await pool.query(
      "UPDATE users SET role='admin' WHERE email=$1 RETURNING id, name, email, role",
      [EMAIL]
    );
    if (!result.rows.length) {
      console.log('Пользователь с таким email не найден.');
    } else {
      console.log('Готово:', result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}

makeAdmin();