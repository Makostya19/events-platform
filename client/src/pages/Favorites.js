import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Favorites = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user, token]);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/favorites/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (eventId) => {
    await axios.delete(`${API_URL}/api/favorites/${eventId}`,
      { headers: { Authorization: `Bearer ${token}` } });
    setFavorites(favorites.filter(e => e.id !== eventId));
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px', color: '#1a1a2e' }}>My Favorites</h1>
      {favorites.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>No favorites yet. <Link to="/events" style={{ color: '#a970ff' }}>Browse events</Link></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {favorites.map(event => (
            <div key={event.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <Link to={`/events/${event.id}`}>
                <div style={{ height: '160px', background: 'linear-gradient(135deg, #0e0e10, #2d1b69)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                  {event.category === 'concert' ? '🎵' : event.category === 'conference' ? '💼' : event.category === 'festival' ? '🎪' : '⚽'}
                </div>
              </Link>
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '8px', color: '#1a1a2e' }}>{event.title}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>📍 {event.location}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', color: '#a970ff' }}>{event.price === '0.00' ? 'Free' : `$${event.price}`}</span>
                  <button onClick={() => removeFromFavorites(event.id)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#888' }}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;