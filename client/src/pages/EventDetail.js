import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEvent();
    fetchReviews();
  }, [id]);

  const fetchEvent = async () => {
    const res = await axios.get(`http://localhost:5000/api/events/${id}`);
    setEvent(res.data);
  };

  const fetchReviews = async () => {
    const res = await axios.get(`http://localhost:5000/api/reviews/${id}`);
    setReviews(res.data);
  };

  const handleBuyTicket = async () => {
    if (!user) return navigate('/login');
    try {
      await axios.post('http://localhost:5000/api/tickets', { event_id: id, quantity },
        { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Ticket booked successfully!');
      fetchEvent();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error booking ticket');
    }
  };

  const handleFavorite = async () => {
    if (!user) return navigate('/login');
    try {
      if (isFavorite) {
        await axios.delete(`http://localhost:5000/api/favorites/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`http://localhost:5000/api/favorites/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await axios.post(`http://localhost:5000/api/reviews/${id}`, { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } });
      setComment('');
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  if (!event) return <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #0e0e10, #2d1b69)', borderRadius: '16px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', marginBottom: '32px' }}>
        {event.category === 'concert' ? '🎵' : event.category === 'conference' ? '💼' : event.category === 'festival' ? '🎪' : '⚽'}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <span style={{ background: '#f0e6ff', color: '#a970ff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>{event.category}</span>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '12px 0 8px', color: '#1a1a2e' }}>{event.title}</h1>
          <p style={{ color: '#666' }}>📍 {event.location} &nbsp;|&nbsp; 📅 {new Date(event.event_date).toLocaleDateString()}</p>
        </div>
        <button onClick={handleFavorite} style={{ background: isFavorite ? '#f0e6ff' : 'white', border: '2px solid #a970ff', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '1.2rem' }}>
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      <p style={{ color: '#444', lineHeight: '1.7', marginBottom: '32px' }}>{event.description}</p>

      {message && <div style={{ background: '#f0e6ff', color: '#a970ff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>{message}</div>}

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#a970ff' }}>{event.price === '0.00' ? 'Free' : `$${event.price}`}</p>
            <p style={{ color: '#888' }}>{event.available_seats} seats available</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="number" min="1" max={event.available_seats} value={quantity}
              onChange={e => setQuantity(e.target.value)}
              style={{ width: '70px', padding: '8px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
            />
            <button onClick={handleBuyTicket} style={{ background: '#a970ff', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
              Book Ticket
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' }}>Reviews ({reviews.length})</h2>
        {user && (
          <form onSubmit={handleReview} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', color: '#333' }}>Rating: </label>
              <select value={rating} onChange={e => setRating(e.target.value)} style={{ marginLeft: '8px', padding: '6px', borderRadius: '6px', border: '1.5px solid #ddd' }}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
              </select>
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your review..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem', minHeight: '80px', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <button type="submit" style={{ marginTop: '12px', background: '#a970ff', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Submit Review
            </button>
          </form>
        )}
        {reviews.map(r => (
          <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', color: '#1a1a2e' }}>{r.name}</span>
              <span>{'⭐'.repeat(r.rating)}</span>
            </div>
            <p style={{ color: '#555' }}>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDetail;