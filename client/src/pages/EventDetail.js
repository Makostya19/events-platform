import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { MusicIcon, BriefcaseIcon, FestivalIcon, SportsIcon, MapPinIcon, CalendarIcon, StarIcon, HeartIcon, SeatIcon } from '../components/Icons';
import './EventDetail.css';

const categoryMeta = {
  concert: { icon: MusicIcon, label: 'Concert' },
  conference: { icon: BriefcaseIcon, label: 'Conference' },
  festival: { icon: FestivalIcon, label: 'Festival' },
  sports: { icon: SportsIcon, label: 'Sports' },
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
  const [messageType, setMessageType] = useState('success');
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

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleBuyTicket = async () => {
    if (!user) return navigate('/login');
    if (!selectedTypeId) {
      showMessage('Please select a ticket type', 'error');
      return;
    }
    setBookingLoading(true);
    try {
      await axios.post(`${API_URL}/api/tickets`, { ticket_type_id: selectedTypeId, quantity },
        { headers: { Authorization: `Bearer ${token}` } });
      showMessage('Ticket booked successfully!', 'success');
      fetchEvent();
      fetchTicketTypes();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Error booking ticket', 'error');
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
      showMessage(err.response?.data?.error || 'Error submitting review', 'error');
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
      showMessage(err.response?.data?.error || 'Error updating review', 'error');
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
      showMessage(err.response?.data?.error || 'Error deleting review', 'error');
    }
  };

  if (!event) return <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</p>;

  const meta = categoryMeta[event.category] || categoryMeta.concert;
  const CatIcon = meta.icon;
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
    <div className="event-detail">
      <div className={`event-hero event-hero--${event.category || 'concert'}`}>
        {event.image_url ? (
          <img src={event.image_url} alt="" className="event-hero-image" />
        ) : (
          <CatIcon width={56} height={56} />
        )}
        <span className="event-hero-badge"><CatIcon width={13} height={13} /> {meta.label}</span>
      </div>

      <div className="event-header">
        <div>
          {avgRating && (
            <p className="event-rating">
              <StarIcon filled width={16} height={16} /> {avgRating} ({reviews.length} review{reviews.length > 1 ? 's' : ''})
            </p>
          )}
          <h1 className="event-title">{event.title}</h1>
          <p className="event-meta-line">
            <MapPinIcon width={15} height={15} /> {event.venue}{event.city ? `, ${event.city}` : ''}
            <span className="event-meta-sep">|</span>
            <CalendarIcon width={15} height={15} /> {new Date(event.starts_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleFavorite}
          disabled={favoriteLoading}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
          className={isFavorite ? 'fav-button-large fav-button-large--active' : 'fav-button-large'}
        >
          <HeartIcon filled={isFavorite} width={20} height={20} />
        </button>
      </div>

      <p className="event-description">{event.description}</p>

      {message && (
        <div role="status" className={`event-status-message event-status-message--${messageType}`}>
          {message}
        </div>
      )}

      <div className="booking-panel">
        <div className="booking-panel-top">
          <div>
            {priceLabel && <p className="booking-price">{priceLabel}</p>}
            <p className="booking-availability">
              {selectedType ? `${selectedType.available_quantity} seats available for this type` : `${event.seats_left ?? 0} seats available`}
            </p>
          </div>
        </div>

        {ticketTypes.length === 0 ? (
          <p className="booking-empty">No tickets are currently available for this event.</p>
        ) : (
          <>
            <fieldset className="ticket-type-list">
              <legend className="ticket-type-legend">Select ticket type</legend>
              {ticketTypes.map(t => (
                <label
                  key={t.id}
                  className={selectedTypeId === t.id ? 'ticket-type-option ticket-type-option--selected' : 'ticket-type-option'}
                >
                  <span className="ticket-type-left">
                    <input
                      type="radio"
                      name="ticketType"
                      checked={selectedTypeId === t.id}
                      onChange={() => setSelectedTypeId(t.id)}
                    />
                    <span>
                      <span className="ticket-type-name">{t.name}</span>
                      <span className="ticket-type-remaining">
                        {t.available_quantity > 0 ? `${t.available_quantity} left` : 'Sold out'}
                      </span>
                    </span>
                  </span>
                  <span className="ticket-type-price">
                    {parseFloat(t.price) === 0 ? 'Free' : `$${t.price}`}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="booking-actions">
              <label htmlFor="ticket-quantity" className="ticket-type-legend">Quantity</label>
              <input
                id="ticket-quantity"
                name="quantity"
                type="number" min="1" max={selectedType?.available_quantity || 1} value={quantity}
                onChange={e => setQuantity(e.target.value)}
                disabled={bookingLoading}
                className="quantity-input"
              />
              <button
                onClick={handleBuyTicket}
                disabled={bookingLoading || !selectedType || selectedType.available_quantity < 1}
                className="btn-book"
              >
                {bookingLoading ? 'Booking...' : 'Book ticket'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="reviews-section">
        <h2 className="reviews-heading">Reviews ({reviews.length})</h2>

        {user && !userReview && (
          <form onSubmit={handleReview} className="review-form">
            <div className="review-form-rating">
              <label htmlFor="review-rating">Rating: </label>
              <select id="review-rating" name="rating" value={rating} onChange={e => setRating(e.target.value)}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
              </select>
            </div>
            <label htmlFor="review-comment" className="ticket-type-legend">Your review</label>
            <textarea
              id="review-comment"
              name="comment"
              value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your review..."
              className="review-textarea"
            />
            <button type="submit" disabled={reviewLoading} className="btn-submit-review">
              {reviewLoading ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        )}

        {reviews.map(r => (
          <div key={r.id} className="review-card">
            {editingReview === r.id ? (
              <form onSubmit={handleUpdateReview}>
                <div className="review-form-rating">
                  <label htmlFor="edit-review-rating">Rating: </label>
                  <select id="edit-review-rating" name="rating" value={editRating} onChange={e => setEditRating(e.target.value)}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
                <label htmlFor="edit-review-comment" className="ticket-type-legend">Edit your review</label>
                <textarea
                  id="edit-review-comment"
                  name="comment"
                  value={editComment} onChange={e => setEditComment(e.target.value)}
                  className="review-textarea"
                />
                <div className="review-edit-actions">
                  <button type="submit" disabled={reviewLoading} className="btn-mini-save">
                    {reviewLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingReview(null)} className="btn-mini-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="review-card-top">
                  <span className="review-author">{r.name}</span>
                  <div className="review-actions">
                    <span className="review-stars"><StarIcon filled width={14} height={14} /> {r.rating}</span>
                    {user && r.user_id === user.id && (
                      <>
                        <button onClick={() => handleEditReview(r)} className="btn-mini-edit">Edit</button>
                        <button onClick={() => handleDeleteReview(r.id)} className="btn-mini-delete">Delete</button>
                      </>
                    )}
                  </div>
                </div>
                <p className="review-comment">{r.comment}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDetail;