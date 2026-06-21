import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const tabs = ['Dashboard', 'Events', 'Bookings', 'Users', 'Reviews'];

const Admin = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px', color: '#1a1a2e' }}>Admin Panel</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '2px solid #eee', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #a970ff' : '3px solid transparent',
              color: activeTab === tab ? '#a970ff' : '#666',
              fontWeight: activeTab === tab ? '700' : '500',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: '-2px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Dashboard' && <DashboardTab token={token} />}
      {activeTab === 'Events' && <EventsTab token={token} />}
      {activeTab === 'Bookings' && <BookingsTab token={token} />}
      {activeTab === 'Users' && <UsersTab token={token} />}
      {activeTab === 'Reviews' && <ReviewsTab token={token} />}
    </div>
  );
};

// ===== DASHBOARD TAB =====
const DashboardTab = ({ token }) => {
  const [stats, setStats] = useState({ events: 0, users: 0, bookings: 0 });
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [eventsRes, usersRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/events`, { params: { limit: 1 } }),
        axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1 } }),
        axios.get(`${API_URL}/api/tickets/admin/all`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 5 } }),
      ]);
      setStats({
        events: eventsRes.data.total || 0,
        users: usersRes.data.total || 0,
        bookings: bookingsRes.data.total || 0,
      });
      setRecentBookings(bookingsRes.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <p style={{ color: '#888', marginBottom: '8px' }}>Total Events</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#a970ff' }}>{stats.events}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ color: '#888', marginBottom: '8px' }}>Total Users</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#3ba9ff' }}>{stats.users}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ color: '#888', marginBottom: '8px' }}>Total Bookings</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#3bd671' }}>{stats.bookings}</p>
        </div>
      </div>

      <h2 style={{ fontWeight: '700', marginBottom: '16px', color: '#1a1a2e' }}>Recent Bookings</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {recentBookings.length === 0 && <p style={{ color: '#888' }}>No bookings yet.</p>}
        {recentBookings.map(b => (
          <div key={b.id} style={{ ...cardStyle, padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{b.user_name} booked <strong>{b.event_title}</strong></span>
            <span style={{ color: '#888' }}>${b.total_price}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== EVENTS TAB =====
const EventsTab = ({ token }) => {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'concert',
    location: '', event_date: '', price: 0, total_seats: 100, status: 'published', image_url: ''
  });
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      setEvents(res.data.items || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, image_url: res.data.url }));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'concert', location: '', event_date: '', price: 0, total_seats: 100, status: 'published', image_url: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/events/${editingId}`, form,
          { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Event updated!');
      } else {
        await axios.post(`${API_URL}/api/events`, form,
          { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Event created!');
      }
      resetForm();
      fetchEvents();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error');
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      event_date: event.event_date?.slice(0, 16),
      price: event.price,
      total_seats: event.total_seats,
      status: event.status,
      image_url: event.image_url || '',
    });
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/api/events/${id}/status`, { status },
        { headers: { Authorization: `Bearer ${token}` } });
      fetchEvents();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error changing status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await axios.delete(`${API_URL}/api/events/${id}`,
      { headers: { Authorization: `Bearer ${token}` } });
    fetchEvents();
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #ddd', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '12px'
  };

  const statusBadge = {
    draft: { bg: '#f1f3f5', color: '#666' },
    published: { bg: '#f0fff4', color: '#2f9e44' },
    cancelled: { bg: '#fff0f0', color: '#e03131' },
    archived: { bg: '#fff9db', color: '#e8a800' },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' }}>{editingId ? 'Edit Event' : 'Create Event'}</h2>
        {message && <div style={{ background: '#f0e6ff', color: '#a970ff', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' }}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <input style={inputStyle} placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="Description (min 20 chars)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          <select style={inputStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="concert">Concert</option>
            <option value="conference">Conference</option>
            <option value="festival">Festival</option>
            <option value="sports">Sports</option>
          </select>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Event Image</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ marginBottom: '8px' }} />
            {uploading && <p style={{ color: '#a970ff', fontSize: '0.85rem' }}>Uploading...</p>}
            {form.image_url && (
              <img src={form.image_url} alt="preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />
            )}
          </div>
          <input style={inputStyle} placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
          <input style={inputStyle} type="datetime-local" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} required />
          <input style={inputStyle} type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} min="0" />
          <input style={inputStyle} type="number" placeholder="Total Seats" value={form.total_seats} onChange={e => setForm({...form, total_seats: e.target.value})} min="1" />
          {editingId && (
            <select style={inputStyle} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '12px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
              {editingId ? 'Update Event' : 'Create Event'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={{ padding: '12px 20px', background: '#eee', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 style={{ fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' }}>All Events ({events.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
          {events.map(event => {
            const sb = statusBadge[event.status] || statusBadge.published;
            return (
              <div key={event.id} style={{ background: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{event.title}</p>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '2px 0' }}>{event.category} · {event.available_seats} seats</p>
                  </div>
                  <span style={{ background: sb.bg, color: sb.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {event.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleEdit(event)} style={{ background: '#eef2ff', color: '#3b5bdb', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                    Edit
                  </button>
                  {event.status !== 'published' && (
                    <button onClick={() => handleStatusChange(event.id, 'published')} style={{ background: '#f0fff4', color: '#2f9e44', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                      Publish
                    </button>
                  )}
                  {event.status === 'published' && (
                    <button onClick={() => handleStatusChange(event.id, 'cancelled')} style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                      Cancel
                    </button>
                  )}
                  {event.status !== 'archived' && (
                    <button onClick={() => handleStatusChange(event.id, 'archived')} style={{ background: '#fff9db', color: '#e8a800', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                      Archive
                    </button>
                  )}
                  <button onClick={() => handleDelete(event.id)} style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===== BOOKINGS TAB =====
const BookingsTab = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  const fetchBookings = async () => {
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get(`${API_URL}/api/tickets/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setBookings(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    confirmed: { bg: '#f0fff4', color: '#2f9e44' },
    cancelled: { bg: '#fff0f0', color: '#e03131' },
    pending: { bg: '#fff9db', color: '#e8a800' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>All Bookings</h2>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #ddd' }}
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {bookings.length === 0 && <p style={{ color: '#888' }}>No bookings found.</p>}
        {bookings.map(b => {
          const sc = statusColors[b.status] || statusColors.confirmed;
          return (
            <div key={b.id} style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <p style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{b.event_title}</p>
                <p style={{ color: '#888', fontSize: '0.85rem', margin: '2px 0' }}>{b.user_name} ({b.user_email})</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#888' }}>x{b.quantity}</span>
                <span style={{ fontWeight: '700', color: '#a970ff' }}>${b.total_price}</span>
                <span style={{ background: sc.bg, color: sc.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                  {b.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
            ← Prev
          </button>
          <span style={{ padding: '8px 16px', fontWeight: '600' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

// ===== USERS TAB =====
const UsersTab = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setUsers(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    if (!window.confirm(`Set this user to ${newStatus}?`)) return;
    try {
      await axios.patch(`${API_URL}/api/admin/users/${id}/status`, { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd' }}
        />
        <button type="submit" style={{ padding: '10px 24px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
          Search
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {users.length === 0 && <p style={{ color: '#888' }}>No users found.</p>}
        {users.map(u => (
          <div key={u.id} style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{u.name}</p>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '2px 0' }}>{u.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#eef2ff', color: '#3b5bdb', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                {u.role}
              </span>
              <span style={{
                background: u.status === 'active' ? '#f0fff4' : '#fff0f0',
                color: u.status === 'active' ? '#2f9e44' : '#e03131',
                padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700'
              }}>
                {u.status}
              </span>
              <button
                onClick={() => toggleStatus(u.id, u.status)}
                style={{
                  background: u.status === 'active' ? '#fff0f0' : '#f0fff4',
                  color: u.status === 'active' ? '#e03131' : '#2f9e44',
                  border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
                }}
              >
                {u.status === 'active' ? 'Block' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
            ← Prev
          </button>
          <span style={{ padding: '8px 16px', fontWeight: '600' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

// ===== REVIEWS TAB =====
const ReviewsTab = ({ token }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) fetchReviews(selectedEvent);
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events`, { params: { limit: 100 } });
      const list = res.data.items || res.data;
      setEvents(list);
      if (list.length) setSelectedEvent(list[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async (eventId) => {
    try {
      const res = await axios.get(`${API_URL}/api/reviews/${eventId}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await axios.delete(`${API_URL}/api/reviews/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      fetchReviews(selectedEvent);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: '600', color: '#333', marginRight: '10px' }}>Select event:</label>
        <select
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #ddd', minWidth: '260px' }}
        >
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reviews.length === 0 && <p style={{ color: '#888' }}>No reviews for this event.</p>}
        {reviews.map(r => (
          <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', color: '#1a1a2e' }}>{r.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>{'⭐'.repeat(r.rating)}</span>
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
            <p style={{ color: '#555', margin: 0 }}>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;