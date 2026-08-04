const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Создаём таблицу ticket_types
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_types (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        price NUMERIC NOT NULL DEFAULT 0,
        total_quantity INTEGER NOT NULL,
        available_quantity INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ ticket_types table created (or already existed)');

    // 2. Добавляем ticket_type_id в tickets, если его ещё нет
    await client.query(`
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS ticket_type_id INTEGER REFERENCES ticket_types(id);
    `);
    console.log('✓ tickets.ticket_type_id column added (or already existed)');

    // 3. Для каждого существующего события, у которого ещё нет ticket_types,
    //    создаём один тип "Standard" на основе текущих price/total_seats/available_seats
    const events = await client.query(`
      SELECT e.id, e.price, e.total_seats, e.available_seats
      FROM events e
      WHERE NOT EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id)
    `);

    for (const ev of events.rows) {
      const result = await client.query(
        `INSERT INTO ticket_types (event_id, name, price, total_quantity, available_quantity, is_active)
         VALUES ($1, 'Standard', $2, $3, $4, true) RETURNING id`,
        [ev.id, ev.price, ev.total_seats, ev.available_seats]
      );
      const ticketTypeId = result.rows[0].id;

      // Привязываем существующие тикеты этого события к новому Standard-типу
      await client.query(
        `UPDATE tickets SET ticket_type_id = $1 WHERE event_id = $2 AND ticket_type_id IS NULL`,
        [ticketTypeId, ev.id]
      );
    }
    console.log(`✓ Migrated ${events.rows.length} existing events into Standard ticket types`);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();