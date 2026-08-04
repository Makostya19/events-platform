const pool = require('./db');

async function checkSchema() {
  const tables = ['events', 'tickets'];
  for (const table of tables) {
    console.log(`\n=== ${table} ===`);
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    console.table(res.rows);
  }
  pool.end();
}

checkSchema().catch(err => {
  console.error(err.message);
  pool.end();
});

const url = new URL(process.env.DATABASE_URL);
console.log('host:', url.hostname);
console.log('port:', url.port);
console.log('database:', url.pathname);
console.log('user:', url.username);