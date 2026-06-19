import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const categoryStyle = {
  concert: { emoji: '🎵', color: '#a970ff', label: 'Concert' },
  conference: { emoji: '💼', color: '#3ba9ff', label: 'Conference' },
  festival: { emoji: '🎪', color: '#ff5fa2', label: 'Festival' },
  sports: { emoji: '⚽', color: '#3bd671', label: 'Sports' },
};

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
      const res = await axios.get(`${API_URL}/api/events`, { params });
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
          <button type="submit" style={{ padding: '10px 24px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
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
          {events.map(event => {
            const cat = categoryStyle[event.category] || categoryStyle.concert;
            return (
              <Link to={`/events/${event.id}`} key={event.id} style={{ textDecoration: 'none' }}>
                <div
                  className="event-card"
                  style={{
                    background: '#16161a',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '1px solid #2a2a30',
                    transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = `0 12px 32px ${cat.color}33`;
                    e.currentTarget.style.borderColor = cat.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#2a2a30';
                  }}
                >
                  <div style={{
                    height: '160px',
                    position: 'relative',
                    background: `radial-gradient(circle at 30% 30%, ${cat.color}55, #0e0e10 70%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                  }}>
                    {cat.emoji}
                    <span style={{
                      position: 'absolute', top: '12px', left: '12px',
                      background: cat.color, color: '#0e0e10',
                      padding: '4px 10px', borderRadius: '20px',
                      fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}>
                      {cat.label}
                    </span>
                    {event.price === '0.00' && (
                      <span style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: '#0e0e10', color: '#3bd671',
                        padding: '4px 10px', borderRadius: '20px',
                        fontSize: '0.7rem', fontWeight: '800',
                        border: '1px solid #3bd671',
                      }}>
                        FREE
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 8px', color: '#fff', fontWeight: '700', fontSize: '1.1rem' }}>{event.title}</h3>
                    <p style={{ color: '#9a9aa5', fontSize: '0.88rem', marginBottom: '6px' }}>📍 {event.location}</p>
                    <p style={{ color: '#9a9aa5', fontSize: '0.88rem', marginBottom: '16px' }}>
                      📅 {new Date(event.event_date).toLocaleDateString()}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2a2a30', paddingTop: '14px' }}>
                      <span style={{ fontWeight: '800', color: cat.color, fontSize: '1.15rem' }}>
                        {event.price === '0.00' ? 'Free' : `$${event.price}`}
                      </span>
                      <span style={{ color: '#9a9aa5', fontSize: '0.8rem' }}>{event.available_seats} seats left</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;