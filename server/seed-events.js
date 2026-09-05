const pool = require('./db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Найдём id админа, чтобы привязать к нему события как к создателю
    const adminRes = await client.query("SELECT id FROM users WHERE email = 'admin@events.com'");
    if (!adminRes.rows.length) {
      throw new Error('Admin user not found — run create-admin.js first');
    }
    const adminId = adminRes.rows[0].id;

    const events = [
      {
        title: 'Seoul Jazz Night',
        description: 'An intimate evening of live jazz featuring top local musicians in the heart of Itaewon.',
        category: 'concert',
        city: 'Seoul',
        venue: 'Blue Square, Itaewon',
        starts_at: '2026-10-15 19:00:00',
        ends_at: '2026-10-15 22:00:00',
        image_url: null,
        ticket_types: [
          { name: 'Standard', price: 35, total_quantity: 100 },
          { name: 'VIP', price: 80, total_quantity: 20 },
        ],
      },
      {
        title: 'Han River Music Festival',
        description: 'A full-day outdoor festival with multiple stages, food trucks, and performances from emerging Korean bands.',
        category: 'festival',
        city: 'Seoul',
        venue: 'Han River Park, Yeouido',
        starts_at: '2026-09-20 12:00:00',
        ends_at: '2026-09-20 23:00:00',
        image_url: null,
        ticket_types: [
          { name: 'General Admission', price: 45, total_quantity: 500 },
          { name: 'Early Bird', price: 30, total_quantity: 100 },
        ],
      },
      {
        title: 'Seoul Tech Summit 2026',
        description: 'A conference bringing together developers, founders, and investors to discuss the future of AI and startups in Asia.',
        category: 'conference',
        city: 'Seoul',
        venue: 'COEX Convention Center',
        starts_at: '2026-11-05 09:00:00',
        ends_at: '2026-11-05 18:00:00',
        image_url: null,
        ticket_types: [
          { name: 'Standard Pass', price: 120, total_quantity: 300 },
          { name: 'Student Pass', price: 50, total_quantity: 100 },
        ],
      },
      {
        title: 'K-League Championship Final',
        description: 'The season finale — watch the top two teams battle for the national championship title.',
        category: 'sports',
        city: 'Seoul',
        venue: 'Seoul World Cup Stadium',
        starts_at: '2026-10-01 18:30:00',
        ends_at: '2026-10-01 20:30:00',
        image_url: null,
        ticket_types: [
          { name: 'General Seating', price: 25, total_quantity: 1000 },
          { name: 'Premium Box', price: 90, total_quantity: 50 },
        ],
      },
      {
        title: 'Busan Indie Film Festival',
        description: 'A showcase of independent films from emerging directors across South Korea, followed by Q&A sessions.',
        category: 'festival',
        city: 'Busan',
        venue: 'Busan Cinema Center',
        starts_at: '2026-10-25 14:00:00',
        ends_at: '2026-10-25 21:00:00',
        image_url: null,
        ticket_types: [
          { name: 'Single Screening', price: 15, total_quantity: 200 },
          { name: 'Full Festival Pass', price: 60, total_quantity: 80 },
        ],
      },
      {
        title: 'Gangnam Startup Meetup',
        description: 'A free networking evening for founders and product people, with lightning talks and open discussion.',
        category: 'conference',
        city: 'Seoul',
        venue: 'WeWork Gangnam',
        starts_at: '2026-09-30 18:00:00',
        ends_at: '2026-09-30 21:00:00',
        image_url: null,
        ticket_types: [
          { name: 'Free Entry', price: 0, total_quantity: 150 },
        ],
      },
    ];

    for (const ev of events) {
      const eventRes = await client.query(
        `INSERT INTO events (title, description, category, city, venue, location, starts_at, ends_at, event_date, price, total_seats, available_seats, image_url, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$5,$6::timestamp,$7::timestamp,$6::timestamp,0,0,0,$8,'published',$9)
         RETURNING id`,
        [ev.title, ev.description, ev.category, ev.city, ev.venue, ev.starts_at, ev.ends_at, ev.image_url, adminId]
      );
      const eventId = eventRes.rows[0].id;

      for (const tt of ev.ticket_types) {
        await client.query(
          `INSERT INTO ticket_types (event_id, name, price, total_quantity, available_quantity, is_active)
           VALUES ($1,$2,$3,$4,$4,true)`,
          [eventId, tt.name, tt.price, tt.total_quantity]
        );
      }

      console.log(`✓ Created "${ev.title}" with ${ev.ticket_types.length} ticket type(s)`);
    }

    await client.query('COMMIT');
    console.log('\nSeed completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();