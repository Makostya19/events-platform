const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://events_platform_db_dmjo_user:Wa4stcQ3iRdntDaB9TG5a0fWVEpJwKqb@dpg-d99nte67r5hc73bhq650-a.virginia-postgres.render.com/events_platform_db_dmjo',
  ssl: { rejectUnauthorized: false }
});

pool.query("UPDATE users SET role='admin' WHERE email='admin@events.com'")
  .then(r => { console.log('Done:', r.rowCount); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
  