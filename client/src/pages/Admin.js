import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const tabs = ['Dashboard', 'Events', 'Bookings', 'Users', 'Reviews'];

// ===== REUSABLE CONFIRMATION MODAL =====
const ConfirmModal = ({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}
      onClick={onCancel}
    >
      <div
        style={{ background: 'white', borderRadius: '14px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1a1a2e', marginBottom: '10px' }}>{title}</h3>
        <p style={{ color: '#555', lineHeight: '1.5', marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', background: '#eee', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
              background: danger ? '#e03131' : '#a970ff', color: 'white'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const useConfirm = () => {
  const [state, setState] = useState(null);

  const confirm = (options, action) => {
    setState({ ...options, action });
  };

  const close = () => setState(null);

  const handleConfirm = async () => {
    if (state?.action) await state.action();
    close();
  };

  const modal = (
    <ConfirmModal
      open={!!state}
      title={state?.title || ''}
      message={state?.message || ''}
      confirmLabel={state?.confirmLabel}
      danger={state?.danger}
      onConfirm={handleConfirm}
      onCancel={close}
    />
  );

  return { confirm, modal };
};

// ===== REUSABLE TOAST =====
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const colors = {
    success: { bg: '#f0fff4', color: '#2f9e44', border: '#b2f2bb' },
    error: { bg: '#fff0f0', color: '#e03131', border: '#ffc9c9' },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 1300,
      background: c.bg, color: c.color, border: `1.5px solid ${c.border}`,
      padding: '14px 20px', borderRadius: '10px', fontWeight: '600',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '12px',
      maxWidth: '360px', animation: 'admin-toast-in 0.2s ease-out',
    }}>
      <style>{`@keyframes admin-toast-in { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.color, cursor: 'pointer', fontSize: '1.1rem', fontWeight: '700', lineHeight: 1 }}>×</button>
    </div>
  );
};

const useToast = () => {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast(null);
  const toastNode = <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />;
  return { showToast, toastNode };
};

// ===== REUSABLE DRAWER =====
const Drawer = ({ open, title, onClose, children }) => {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 900,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      />
      <div
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: '480px', maxWidth: '92vw',
          background: 'white', zIndex: 901, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease-out',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1a1a2e', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', lineHeight: 1, padding: '4px' }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>
      </div>
    </>
  );
};

const Admin = () => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) return null;
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
      {activeTab === 'Users' && <UsersTab token={token} currentUserId={user.id} />}
      {activeTab === 'Reviews' && <ReviewsTab token={token} />}
    </div>
  );
};

// ===== DASHBOARD TAB =====
const SkeletonBlock = ({ width = '100%', height = '16px' }) => (
  <div style={{
    width, height, borderRadius: '6px',
    background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)',
    backgroundSize: '200% 100%', animation: 'admin-skeleton 1.4s ease-in-out infinite',
  }} />
);

const DashboardTab = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState(null);
  const [lowInventory, setLowInventory] = useState(null);
  const [cancelledBookings, setCancelledBookings] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [eventsRes, usersRes, bookingsRes, dashboardRes, cancelledRes] = await Promise.all([
        axios.get(`${API_URL}/api/events`, { params: { limit: 1 } }),
        axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1 } }),
        axios.get(`${API_URL}/api/tickets/admin/all`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 5 } }),
        axios.get(`${API_URL}/api/events/meta/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/tickets/admin/all`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 5, status: 'cancelled' } }),
      ]);
      setStats({
        events: eventsRes.data.total || 0,
        users: usersRes.data.total || 0,
        bookings: bookingsRes.data.total || 0,
      });
      setRecentBookings(bookingsRes.data.items || []);
      setUpcomingEvents(dashboardRes.data.upcomingEvents || []);
      setLowInventory(dashboardRes.data.lowInventory || []);
      setCancelledBookings(cancelledRes.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };

  return (
    <div>
      <style>{`@keyframes admin-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <p style={{ color: '#888', marginBottom: '8px' }}>Total Events</p>
          {stats === null ? <SkeletonBlock width="60px" height="32px" /> : <p style={{ fontSize: '2rem', fontWeight: '800', color: '#a970ff' }}>{stats.events}</p>}
        </div>
        <div style={cardStyle}>
          <p style={{ color: '#888', marginBottom: '8px' }}>Total Users</p>
          {stats === null ? <SkeletonBlock width="60px" height="32px" /> : <p style={{ fontSize: '2rem', fontWeight: '800', color: '#3ba9ff' }}>{stats.users}</p>}
        </div>
        <div style={cardStyle}>
          <p style={{ color: '#888', marginBottom: '8px' }}>Total Bookings</p>
          {stats === null ? <SkeletonBlock width="60px" height="32px" /> : <p style={{ fontSize: '2rem', fontWeight: '800', color: '#3bd671' }}>{stats.bookings}</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', color: '#1a1a2e', fontSize: '1.05rem' }}>Upcoming Events</h2>
          {upcomingEvents === null && <SkeletonBlock height="18px" />}
          {upcomingEvents !== null && upcomingEvents.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>No upcoming published events.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingEvents?.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#1a1a2e', fontWeight: '600' }}>{e.title}</span>
                <span style={{ color: '#888' }}>{new Date(e.starts_at).toLocaleDateString()}{e.city ? ` · ${e.city}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', color: '#1a1a2e', fontSize: '1.05rem' }}>Low Inventory <span style={{ color: '#e8a800', fontWeight: '500', fontSize: '0.8rem' }}>(≤10% left)</span></h2>
          {lowInventory === null && <SkeletonBlock height="18px" />}
          {lowInventory !== null && lowInventory.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>Nothing running low right now.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lowInventory?.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#1a1a2e', fontWeight: '600' }}>{t.title} — {t.ticket_type_name}</span>
                <span style={{ color: '#e8a800', fontWeight: '700' }}>{t.available_quantity}/{t.total_quantity} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', color: '#1a1a2e' }}>Recent Bookings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentBookings === null && (
              <>
                <div style={{ ...cardStyle, padding: '14px 20px' }}><SkeletonBlock height="18px" /></div>
                <div style={{ ...cardStyle, padding: '14px 20px' }}><SkeletonBlock height="18px" /></div>
              </>
            )}
            {recentBookings !== null && recentBookings.length === 0 && <p style={{ color: '#888' }}>No bookings yet.</p>}
            {recentBookings?.map(b => (
              <div key={b.id} style={{ ...cardStyle, padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{b.user_name} booked <strong>{b.event_title}</strong></span>
                <span style={{ color: '#888' }}>${b.total_price}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', color: '#1a1a2e' }}>Recently Cancelled</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cancelledBookings === null && (
              <>
                <div style={{ ...cardStyle, padding: '14px 20px' }}><SkeletonBlock height="18px" /></div>
                <div style={{ ...cardStyle, padding: '14px 20px' }}><SkeletonBlock height="18px" /></div>
              </>
            )}
            {cancelledBookings !== null && cancelledBookings.length === 0 && <p style={{ color: '#888' }}>No cancellations.</p>}
            {cancelledBookings?.map(b => (
              <div key={b.id} style={{ ...cardStyle, padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{b.user_name} cancelled <strong>{b.event_title}</strong></span>
                <span style={{ color: '#e03131' }}>${b.total_price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== TICKET TYPES MANAGER (used inside the Event editor drawer) =====
const TicketTypesManager = ({ eventId, token, onChange }) => {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', price: 0, total_quantity: 10 });
  const [ttError, setTtError] = useState('');
  const { confirm, modal } = useConfirm();

  useEffect(() => {
    fetchTicketTypes();
  }, [eventId]);

  const fetchTicketTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/${eventId}/ticket-types`);
      setTicketTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetTypeForm = () => {
    setTypeForm({ name: '', price: 0, total_quantity: 10 });
    setEditingTypeId(null);
    setTtError('');
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    setTtError('');
    try {
      if (editingTypeId) {
        await axios.put(`${API_URL}/api/ticket-types/${editingTypeId}`, typeForm,
          { headers: { Authorization: `Bearer ${token}` } });
        onChange?.('Ticket type updated!');
      } else {
        await axios.post(`${API_URL}/api/events/${eventId}/ticket-types`, typeForm,
          { headers: { Authorization: `Bearer ${token}` } });
        onChange?.('Ticket type created!');
      }
      resetTypeForm();
      fetchTicketTypes();
    } catch (err) {
      setTtError(err.response?.data?.error || 'Error saving ticket type');
    }
  };

  const handleTypeEdit = (t) => {
    setEditingTypeId(t.id);
    setTypeForm({ name: t.name, price: t.price, total_quantity: t.total_quantity });
  };

  const handleToggleActive = async (t) => {
    try {
      await axios.patch(`${API_URL}/api/ticket-types/${t.id}/status`, { is_active: !t.is_active },
        { headers: { Authorization: `Bearer ${token}` } });
      fetchTicketTypes();
    } catch (err) {
      setTtError(err.response?.data?.error || 'Error changing status');
    }
  };

  const handleTypeDelete = (id) => {
    confirm(
      { title: 'Delete ticket type?', message: 'This is only possible if it has no bookings yet. This action cannot be undone.', confirmLabel: 'Delete', danger: true },
      async () => {
        try {
          await axios.delete(`${API_URL}/api/ticket-types/${id}`,
            { headers: { Authorization: `Bearer ${token}` } });
          fetchTicketTypes();
        } catch (err) {
          setTtError(err.response?.data?.error || 'Error deleting ticket type');
        }
      }
    );
  };

  const smallInput = {
    padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #ddd', fontSize: '0.9rem', boxSizing: 'border-box'
  };

  return (
    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
      {modal}
      <h3 style={{ fontWeight: '700', marginBottom: '14px', color: '#1a1a2e', fontSize: '1.05rem' }}>Ticket Types</h3>

      {ttError && <div style={{ background: '#fff0f0', color: '#e03131', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontWeight: '600', fontSize: '0.85rem' }}>{ttError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {ticketTypes.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>No ticket types yet. An event needs at least one active ticket type before it can be published.</p>}
        {ticketTypes.map(t => {
          const sold = t.total_quantity - t.available_quantity;
          return (
            <div key={t.id} style={{ background: '#f8f8fa', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontWeight: '700', color: '#1a1a2e' }}>{t.name}</span>
                <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: '10px' }}>
                  ${t.price} · {t.available_quantity}/{t.total_quantity} left · {sold} sold
                </span>
                {!t.is_active && (
                  <span style={{ marginLeft: '10px', background: '#fff0f0', color: '#e03131', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700' }}>
                    Inactive
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => handleTypeEdit(t)} style={{ background: '#eef2ff', color: '#3b5bdb', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem' }}>
                  Edit
                </button>
                <button onClick={() => handleToggleActive(t)} style={{ background: t.is_active ? '#fff9db' : '#f0fff4', color: t.is_active ? '#e8a800' : '#2f9e44', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem' }}>
                  {t.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleTypeDelete(t.id)} style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem' }}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleTypeSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333', fontSize: '0.8rem' }}>Name</label>
          <input style={{ ...smallInput, width: '140px' }} placeholder="e.g. VIP" value={typeForm.name}
            onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333', fontSize: '0.8rem' }}>Price ($)</label>
          <input style={{ ...smallInput, width: '90px' }} type="number" min="0" value={typeForm.price}
            onChange={e => setTypeForm({ ...typeForm, price: e.target.value })} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#333', fontSize: '0.8rem' }}>Total Qty</label>
          <input style={{ ...smallInput, width: '90px' }} type="number" min="1" value={typeForm.total_quantity}
            onChange={e => setTypeForm({ ...typeForm, total_quantity: e.target.value })} required />
        </div>
        <button type="submit" style={{ padding: '9px 16px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
          {editingTypeId ? 'Update Type' : 'Add Type'}
        </button>
        {editingTypeId && (
          <button type="button" onClick={resetTypeForm} style={{ padding: '9px 16px', background: '#eee', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

// ===== EVENT EDITOR (content of the drawer) =====
const emptyEventForm = { title: '', description: '', category: 'concert', city: '', venue: '', startsAt: '', endsAt: '', image_url: '' };

const EventEditor = ({ token, editingId, setEditingId, onSaved, onClose }) => {
  const [form, setForm] = useState(emptyEventForm);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingId === 'new') {
      setForm(emptyEventForm);
      setFormError('');
    } else if (editingId) {
      fetchEvent(editingId);
    }
  }, [editingId]);

  const fetchEvent = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/api/events/${id}`);
      const event = res.data;
      setForm({
        title: event.title,
        description: event.description,
        category: event.category,
        city: event.city || '',
        venue: event.venue || '',
        startsAt: event.starts_at?.slice(0, 16) || '',
        endsAt: event.ends_at?.slice(0, 16) || '',
        image_url: event.image_url || '',
      });
      setFormError('');
    } catch (err) {
      setFormError('Could not load event');
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
      setFormError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId !== 'new') {
        await axios.put(`${API_URL}/api/events/${editingId}`, form,
          { headers: { Authorization: `Bearer ${token}` } });
        onSaved('Event updated!');
      } else {
        const res = await axios.post(`${API_URL}/api/events`, form,
          { headers: { Authorization: `Bearer ${token}` } });
        onSaved(res.data.note || 'Event created as draft.');
        setEditingId(res.data.id); // switch drawer to edit mode so ticket types can be added
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #ddd', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '12px'
  };

  const isNew = editingId === 'new';

  return (
    <div>
      {formError && <div style={{ background: '#fff0f0', color: '#e03131', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' }}>{formError}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Title</label>
          <input style={{...inputStyle, marginBottom: 0}} placeholder="e.g. Jazz Night" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Description <span style={{ color: '#999', fontWeight: '400' }}>(min 20 characters)</span></label>
          <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: 0}} placeholder="Describe the event..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Category</label>
          <select style={{...inputStyle, marginBottom: 0}} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="concert">Concert</option>
            <option value="conference">Conference</option>
            <option value="festival">Festival</option>
            <option value="sports">Sports</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Event Image</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ marginBottom: '8px' }} />
          {uploading && <p style={{ color: '#a970ff', fontSize: '0.85rem' }}>Uploading...</p>}
          {form.image_url && (
            <img src={form.image_url} alt="preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>City</label>
          <input style={{...inputStyle, marginBottom: 0}} placeholder="e.g. Seoul" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Venue</label>
          <input style={{...inputStyle, marginBottom: 0}} placeholder="e.g. Blue Square" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} required />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Starts At</label>
          <input style={{...inputStyle, marginBottom: 0}} type="datetime-local" value={form.startsAt} onChange={e => setForm({...form, startsAt: e.target.value})} required />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Ends At</label>
          <input style={{...inputStyle, marginBottom: 0}} type="datetime-local" value={form.endsAt} onChange={e => setForm({...form, endsAt: e.target.value})} required />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ flex: 1, padding: '12px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
            {isNew ? 'Create Event' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} style={{ padding: '12px 20px', background: '#eee', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </form>

      {!isNew && <TicketTypesManager eventId={editingId} token={token} onChange={onSaved} />}
    </div>
  );
};

// ===== EVENTS TAB =====
const EventsTab = ({ token }) => {
  const [events, setEvents] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState(null); // null = closed, 'new' = create, number = edit
  const { confirm, modal } = useConfirm();
  const { showToast, toastNode } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [page, statusFilter]);

  const fetchEvents = async (overridePage) => {
    try {
      const params = { page: overridePage || page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get(`${API_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setEvents(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents(1);
  };

  const handleEditorSaved = (message) => {
    showToast(message);
    fetchEvents();
  };

  const applyStatusChange = async (id, status, force) => {
    try {
      await axios.patch(`${API_URL}/api/events/${id}/status`, force ? { status, force: true } : { status },
        { headers: { Authorization: `Bearer ${token}` } });
      showToast('Event status updated');
      fetchEvents();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Error changing status';
      if (!force && errMsg.toLowerCase().includes('force')) {
        confirm(
          { title: 'Confirm this action', message: errMsg, confirmLabel: 'Proceed anyway', danger: true },
          () => applyStatusChange(id, status, true)
        );
      } else {
        showToast(errMsg, 'error');
      }
    }
  };

  const handleStatusChange = (id, status, label, danger) => {
    confirm(
      { title: `${label}?`, message: `Are you sure you want to ${label.toLowerCase()} this event?`, confirmLabel: label, danger },
      () => applyStatusChange(id, status)
    );
  };

  const handleDelete = (id) => {
    confirm(
      { title: 'Delete permanently?', message: 'This will permanently delete the event and cannot be undone.', confirmLabel: 'Delete permanently', danger: true },
      async () => {
        await axios.delete(`${API_URL}/api/events/${id}`,
          { headers: { Authorization: `Bearer ${token}` } });
        showToast('Event deleted');
        fetchEvents();
      }
    );
  };

  const statusBadge = {
    draft: { bg: '#f1f3f5', color: '#666' },
    published: { bg: '#f0fff4', color: '#2f9e44' },
    cancelled: { bg: '#fff0f0', color: '#e03131' },
    completed: { bg: '#fff9db', color: '#e8a800' },
  };

  return (
    <div>
      {modal}
      {toastNode}

      <Drawer
        open={!!editingId}
        title={editingId === 'new' ? 'Create Event' : 'Edit Event'}
        onClose={() => setEditingId(null)}
      >
        {editingId && (
          <EventEditor
            token={token}
            editingId={editingId}
            setEditingId={setEditingId}
            onSaved={handleEditorSaved}
            onClose={() => setEditingId(null)}
          />
        )}
      </Drawer>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>All Events</h2>
        <button
          onClick={() => setEditingId('new')}
          style={{ padding: '10px 20px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          + New Event
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Search by title or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '0.9rem' }}
        />
        <button type="submit" style={{ padding: '9px 18px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
          Search
        </button>
      </form>

      <select
        value={statusFilter}
        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        style={{ padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #ddd', marginBottom: '16px', fontSize: '0.9rem' }}
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {events.length === 0 && <p style={{ color: '#888' }}>No events found.</p>}
        {events.map(event => {
          const sb = statusBadge[event.status] || statusBadge.draft;
          return (
            <div key={event.id} style={{ background: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{event.title}</p>
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: '2px 0' }}>
                    {event.category} · {event.city || '—'} · {event.seats_left ?? 0}/{event.capacity ?? 0} seats
                  </p>
                </div>
                <span style={{ background: sb.bg, color: sb.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                  {event.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setEditingId(event.id)} style={{ background: '#eef2ff', color: '#3b5bdb', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                  Edit
                </button>
                {event.status !== 'published' && (
                  <button onClick={() => handleStatusChange(event.id, 'published', 'Publish', false)} style={{ background: '#f0fff4', color: '#2f9e44', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                    Publish
                  </button>
                )}
                {event.status === 'published' && (
                  <button onClick={() => handleStatusChange(event.id, 'cancelled', 'Cancel event', true)} style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                    Cancel event
                  </button>
                )}
                {event.status !== 'completed' && (
                  <button onClick={() => handleStatusChange(event.id, 'completed', 'Mark completed', false)} style={{ background: '#fff9db', color: '#e8a800', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                    Mark completed
                  </button>
                )}
                <button onClick={() => handleDelete(event.id)} style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                  Delete permanently
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
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

// ===== BOOKINGS TAB =====
const BookingsTab = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, sort, page]);

  const fetchBookings = async (overridePage) => {
    try {
      const params = { page: overridePage || page, limit: 15, sort };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings(1);
  };

  const statusColors = {
    confirmed: { bg: '#f0fff4', color: '#2f9e44' },
    cancelled: { bg: '#fff0f0', color: '#e03131' },
    pending: { bg: '#fff9db', color: '#e8a800' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>All Bookings</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #ddd' }}
          >
            <option value="created_desc">Booked: Newest first</option>
            <option value="created_asc">Booked: Oldest first</option>
            <option value="event_date_asc">Event date: Soonest first</option>
            <option value="event_date_desc">Event date: Latest first</option>
          </select>
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
      </div>

      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by user name, email, or event title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd' }}
        />
        <button type="submit" style={{ padding: '10px 24px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
          Search
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {bookings.length === 0 && <p style={{ color: '#888' }}>No bookings found.</p>}
        {bookings.map(b => {
          const sc = statusColors[b.status] || statusColors.confirmed;
          return (
            <div key={b.id} style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <p style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{b.event_title}</p>
                <p style={{ color: '#888', fontSize: '0.85rem', margin: '2px 0' }}>
                  {b.user_name} ({b.user_email}){b.ticket_type_name ? ` · ${b.ticket_type_name}` : ''}
                </p>
                {b.event_starts_at && (
                  <p style={{ color: '#aaa', fontSize: '0.78rem', margin: 0 }}>
                    Event: {new Date(b.event_starts_at).toLocaleDateString()}
                  </p>
                )}
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
const UsersTab = ({ token, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { confirm, modal } = useConfirm();

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

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    confirm(
      { title: `${newStatus === 'blocked' ? 'Block' : 'Activate'} this user?`, message: `Are you sure you want to set this user to ${newStatus}?`, confirmLabel: newStatus === 'blocked' ? 'Block' : 'Activate', danger: newStatus === 'blocked' },
      async () => {
        try {
          await axios.patch(`${API_URL}/api/admin/users/${id}/status`, { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } });
          fetchUsers();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  return (
    <div>
      {modal}
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
        {users.map(u => {
          const isSelf = u.id === currentUserId;
          return (
            <div key={u.id} style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <p style={{ fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{u.name}{isSelf ? ' (you)' : ''}</p>
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
                {isSelf ? (
                  <span style={{ color: '#aaa', fontSize: '0.78rem', fontStyle: 'italic' }}>Can't block yourself</span>
                ) : (
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
                )}
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

// ===== REVIEWS TAB =====
const ReviewsTab = ({ token }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [reviews, setReviews] = useState([]);
  const { confirm, modal } = useConfirm();

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

  const handleDelete = (id) => {
    confirm(
      { title: 'Delete review?', message: 'This action cannot be undone.', confirmLabel: 'Delete', danger: true },
      async () => {
        try {
          await axios.delete(`${API_URL}/api/reviews/${id}`,
            { headers: { Authorization: `Bearer ${token}` } });
          fetchReviews(selectedEvent);
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  return (
    <div>
      {modal}
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