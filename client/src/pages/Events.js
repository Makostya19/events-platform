import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const fetchEvents = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      const res = await axios.get('http://localhost:5000/api/events', { params });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px', color: '#1a1a2e' }}>All Events</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem' }}
          />
          <button type="submit" style={{ padding: '10px 24px', background: '#3b5bdb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            Search
          </button>
        </form>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem' }}
        >
          <option value="">All Categories</option>
          <option value="concert">Concerts</option>
          <option value="conference">Conferences</option>
          <option value="festival">Festivals</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>
      ) : events.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888' }}>No events found</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {events.map(event => (
            <Link to={`/events/${event.id}`} key={event.id} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '180px', background: 'linear-gradient(135deg, #1a1a2e, #3b5bdb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                  {event.category === 'concert' ? '🎵' : event.category === 'conference' ? '💼' : event.category === 'festival' ? '🎪' : '⚽'}
                </div>
                <div style={{ padding: '20px' }}>
                  <span style={{ background: '#eef2ff', color: '#3b5bdb', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                    {event.category || 'Event'}
                  </span>
                  <h3 style={{ margin: '10px 0 8px', color: '#1a1a2e', fontWeight: '700' }}>{event.title}</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>📍 {event.location}</p>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>
                    📅 {new Date(event.event_date).toLocaleDateString()}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', color: '#3b5bdb', fontSize: '1.1rem' }}>
                      {event.price === '0.00' ? 'Free' : `$${event.price}`}
                    </span>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>{event.available_seats} seats left</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;