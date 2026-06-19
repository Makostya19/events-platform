import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: 'concert',
    location: '', event_date: '', price: 0, total_seats: 100
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    const res = await axios.get('http://localhost:5000/api/events');
    setEvents(res.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/events', form,
        { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Event created!');
      setForm({ title: '', description: '', category: 'concert', location: '', event_date: '', price: 0, total_seats: 100 });
      fetchEvents();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await axios.delete(`http://localhost:5000/api/events/${id}`,
      { headers: { Authorization: `Bearer ${token}` } });
    fetchEvents();
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #ddd', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '12px'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '32px', color: '#1a1a2e' }}>Admin Panel</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' }}>Create Event</h2>
          {message && <div style={{ background: '#f0e6ff', color: '#a970ff', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' }}>{message}</div>}
          <form onSubmit={handleCreate}>
            <input style={inputStyle} placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <select style={inputStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="concert">Concert</option>
              <option value="conference">Conference</option>
              <option value="festival">Festival</option>
              <option value="sports">Sports</option>
            </select>
            <input style={inputStyle} placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
            <input style={inputStyle} type="datetime-local" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} required />
            <input style={inputStyle} type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} min="0" />
            <input style={inputStyle} type="number" placeholder="Total Seats" value={form.total_seats} onChange={e => setForm({...form, total_seats: e.target.value})} min="1" />
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
              Create Event
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ fontWeight: '700', marginBottom: '20px', color: '#1a1a2e' }}>All Events ({events.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map(event => (
              <div key={event.id} style={{ background: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: '700', color: '#1a1a2e' }}>{event.title}</p>
                  <p style={{ color: '#888', fontSize: '0.85rem' }}>{event.category} · {event.available_seats} seats</p>
                </div>
                <button onClick={() => handleDelete(event.id)} style={{ background: '#fff0f0', color: '#e03131', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600' }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;