import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const categoryStyle = {
  concert: { emoji: '🎵', color: '#a970ff', label: 'Concert' },
  conference: { emoji: '💼', color: '#3ba9ff', label: 'Conference' },
  festival: { emoji: '🎪', color: '#ff5fa2', label: 'Festival' },
  sports: { emoji: '⚽', color: '#3bd671', label: 'Sports' },
};

const EventDetail = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchTicketTypes();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (user) fetchFavoriteStatus();
    else setIsFavorite(false);
  }, [id, user]);

  const fetchEvent = async () => {
    const res = await axios.get(`${API_URL}/api/events/${id}`);
    setEvent(res.data);
  };

  const fetchTicketTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/${id}/ticket-types`);
      const active = res.data.filter(t => t.is_active);
      setTicketTypes(active);
      if (active.length) setSelectedTypeId(active[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    const res = await axios.get(`${API_URL}/api/reviews/${id}`);
    setReviews(res.data);
  };

  const fetchFavoriteStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/favorites/my`, { headers: { Authorization: `Bearer ${token}` } });
      setIsFavorite(res.data.some(e => String(e.id) === String(id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyTicket = async () => {
    if (!user) return navigate('/login');
    if (!selectedTypeId) {
      setMessage('Please select a ticket type');
      return;
    }
    setBookingLoading(true);
    try {
      await axios.post(`${API_URL}/api/tickets`, { ticket_type_id: selectedTypeId, quantity },
        { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Ticket booked successfully!');
      fetchEvent();
      fetchTicketTypes();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error booking ticket');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) return navigate('/login');
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API_URL}/api/favorites/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/favorites/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setReviewLoading(true);
    try {
      await axios.post(`${API_URL}/api/reviews/${id}`, { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } });
      setComment('');
      fetchReviews();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error submitting review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      await axios.put(`${API_URL}/api/reviews/${editingReview}`,
        { rating: editRating, comment: editComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error updating review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await axios.delete(`${API_URL}/api/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReviews();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error deleting review');
    }
  };

  if (!event) return <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</p>;

  const cat = categoryStyle[event.category] || categoryStyle.concert;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const userReview = reviews.find(r => r.user_id === user?.id);
  const selectedType = ticketTypes.find(t => t.id === selectedTypeId);
  const priceLabel = ticketTypes.length
    ? (() => {
        const prices = ticketTypes.map(t => parseFloat(t.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === 0 && max === 0) return 'Free';
        if (min === max) return `$${min}`;
        return `$${min} – $${max}`;
      })()
    : null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{
        borderRadius: '16px', height: '280px', position: 'relative',
        background: event.image_url ? `url(${event.image_url}) center/cover` : `radial-gradient(circle at 30% 30%, ${cat.color}55, #0e0e10 70%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '5rem', marginBottom: '32px', border: `1px solid ${cat.color}55`,
      }}>
        {!event.image_url && cat.emoji}
        <span style={{
          position: 'absolute', top: '16px', left: '16px',
          background: cat.color, color: '#0e0e10',
          padding: '5px 14px', borderRadius: '20px',
          fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          {cat.label}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          {avgRating && (
            <p style={{ color: '#f5a623', fontWeight: '700', marginBottom: '6px' }}>
              {'⭐'.repeat(Math.round(avgRating))} {avgRating} ({reviews.length} review{reviews.length > 1 ? 's' : ''})
            </p>
          )}
          <h1 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '0 0 8px', color: '#1a1a2e' }}>{event.title}</h1>
          <p style={{ color: '#666' }}>
            📍 {event.venue}{event.city ? `, ${event.city}` : ''} &nbsp;|&nbsp; 📅 {new Date(event.starts_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleFavorite}
          disabled={favoriteLoading}
          style={{
            background: isFavorite ? `${cat.color}22` : 'white',
            border: `2px solid ${cat.color}`, borderRadius: '10px',
            padding: '12px 18px', cursor: favoriteLoading ? 'not-allowed' : 'pointer',
            fontSize: '1.3rem', transition: 'transform 0.15s',
            opacity: favoriteLoading ? 0.7 : 1,
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      <p style={{ color: '#444', lineHeight: '1.7', marginBottom: '32px', fontSize: '1.02rem' }}>{event.description}</p>

      {message && (
        <div style={{ background: `${cat.color}1a`, color: cat.color, padding: '14px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: '700', border: `1px solid ${cat.color}44` }}>
          {message}
        </div>
      )}

      <div style={{ background: '#16161a', borderRadius: '14px', padding: '28px', marginBottom: '32px', border: '1px solid #2a2a30' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            {priceLabel && <p style={{ fontSize: '2.2rem', fontWeight: '800', color: cat.color, margin: 0 }}>{priceLabel}</p>}
            <p style={{ color: '#9a9aa5', margin: '4px 0 0' }}>
              {selectedType ? `${selectedType.available_quantity} seats available for this type` : `${event.seats_left ?? 0} seats available`}
            </p>
          </div>
        </div>

        {ticketTypes.length === 0 ? (
          <p style={{ color: '#9a9aa5' }}>No tickets are currently available for this event.</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {ticketTypes.map(t => (
                <label
                  key={t.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                    border: `2px solid ${selectedTypeId === t.id ? cat.color : '#2a2a30'}`,
                    background: selectedTypeId === t.id ? `${cat.color}11` : 'transparent',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="ticketType"
                      checked={selectedTypeId === t.id}
                      onChange={() => setSelectedTypeId(t.id)}
                    />
                    <span>
                      <span style={{ color: 'white', fontWeight: '700', display: 'block' }}>{t.name}</span>
                      <span style={{ color: '#9a9aa5', fontSize: '0.85rem' }}>
                        {t.available_quantity > 0 ? `${t.available_quantity} left` : 'Sold out'}
                      </span>
                    </span>
                  </span>
                  <span style={{ color: cat.color, fontWeight: '800' }}>
                    {parseFloat(t.price) === 0 ? 'Free' : `$${t.price}`}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="number" min="1" max={selectedType?.available_quantity || 1} value={quantity}
                onChange={e => setQuantity(e.target.value)}
                disabled={bookingLoading}
                style={{ width: '70px', padding: '10px', borderRadius: '8px', border: '1.5px solid #3a3a42', background: '#0e0e10', color: 'white', fontSize: '1rem', textAlign: 'center' }}
              />
              <button
                onClick={handleBuyTicket}
                disabled={bookingLoading || !selectedType || selectedType.available_quantity < 1}
                style={{
                  background: cat.color, color: '#0e0e10', border: 'none',
                  padding: '13px 28px', borderRadius: '8px', fontWeight: '800',
                  fontSize: '1rem', cursor: (bookingLoading || !selectedType || selectedType.available_quantity < 1) ? 'not-allowed' : 'pointer',
                  opacity: (bookingLoading || !selectedType || selectedType.available_quantity < 1) ? 0.7 : 1,
                }}
              >
                {bookingLoading ? 'Booking...' : 'Book Ticket'}
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' }}>Reviews ({reviews.length})</h2>

        {user && !userReview && (
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
            <button
              type="submit"
              disabled={reviewLoading}
              style={{
                marginTop: '12px', background: cat.color, color: '#0e0e10',
                border: 'none', padding: '10px 24px', borderRadius: '8px',
                fontWeight: '800', cursor: reviewLoading ? 'not-allowed' : 'pointer',
                opacity: reviewLoading ? 0.7 : 1,
              }}
            >
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.map(r => (
          <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
            {editingReview === r.id ? (
              <form onSubmit={handleUpdateReview}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontWeight: '600', color: '#333' }}>Rating: </label>
                  <select value={editRating} onChange={e => setEditRating(e.target.value)} style={{ marginLeft: '8px', padding: '6px', borderRadius: '6px', border: '1.5px solid #ddd' }}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
                <textarea value={editComment} onChange={e => setEditComment(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem', minHeight: '80px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    style={{
                      background: cat.color, color: '#0e0e10', border: 'none',
                      padding: '8px 20px', borderRadius: '8px', fontWeight: '700',
                      cursor: reviewLoading ? 'not-allowed' : 'pointer',
                      opacity: reviewLoading ? 0.7 : 1,
                    }}
                  >
                    {reviewLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingReview(null)} style={{ background: '#eee', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#1a1a2e' }}>{r.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{'⭐'.repeat(r.rating)}</span>
                    {user && r.user_id === user.id && (
                      <>
                        <button onClick={() => handleEditReview(r)} style={{ background: '#eef2ff', color: '#3b5bdb', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteReview(r.id)} style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p style={{ color: '#555', margin: 0 }}>{r.comment}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDetail;