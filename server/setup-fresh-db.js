const pool = require('./db');

async function setup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR,
        role VARCHAR DEFAULT 'user',
        status VARCHAR DEFAULT 'active',
        provider VARCHAR,
        provider_id VARCHAR,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ users table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        description TEXT,
        category VARCHAR,
        location VARCHAR,
        event_date TIMESTAMP NOT NULL,
        start_datetime TIMESTAMP,
        end_datetime TIMESTAMP,
        price NUMERIC DEFAULT 0,
        total_seats INTEGER NOT NULL DEFAULT 0,
        available_seats INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        status VARCHAR DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT now(),
        city VARCHAR,
        venue VARCHAR,
        starts_at TIMESTAMP,
        ends_at TIMESTAMP
      );
    `);
    console.log('✓ events table created');

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
    console.log('✓ ticket_types table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_id INTEGER REFERENCES events(id),
        ticket_type_id INTEGER REFERENCES ticket_types(id),
        quantity INTEGER DEFAULT 1,
        total_price NUMERIC,
        status VARCHAR DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ tickets table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, event_id)
      );
    `);
    console.log('✓ favorites table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_id INTEGER REFERENCES events(id),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ reviews table created');

    await client.query('COMMIT');
    console.log('\nAll tables created successfully. Database is ready.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Setup failed, rolled back:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

setup();