const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Добавляем новые колонки, не трогая старые (безопасно для существующих данных)
    await client.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS city VARCHAR,
        ADD COLUMN IF NOT EXISTS venue VARCHAR,
        ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP;
    `);
    console.log('✓ New columns added (city, venue, starts_at, ends_at)');

    // 2. Заполняем новые поля на основе старых данных для уже существующих событий
    //    location -> venue (целиком, т.к. city отдельно не выделить автоматически надёжно)
    //    event_date -> starts_at; ends_at берём из уже существующего end_datetime, либо +3 часа
    await client.query(`
      UPDATE events
      SET
        venue = COALESCE(venue, location),
        starts_at = COALESCE(starts_at, event_date),
        ends_at = COALESCE(ends_at, end_datetime, event_date + INTERVAL '3 hours')
      WHERE starts_at IS NULL OR venue IS NULL OR ends_at IS NULL;
    `);
    console.log('✓ Existing events backfilled into new columns');

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
    console.log('NOTE: "city" is empty for existing events — needs manual entry per event (see below).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();