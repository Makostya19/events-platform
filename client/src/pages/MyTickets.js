import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const statusColors = {
  confirmed: { bg: '#f0fff4', color: '#2f9e44' },
  cancelled: { bg: '#fff0f0', color: '#e03131' },
  pending: { bg: '#fff9db', color: '#e8a800' },
};

const sortOptions = [
  { value: 'created_desc', label: 'Booked: Newest first' },
  { value: 'created_asc', label: 'Booked: Oldest first' },
  { value: 'event_date_asc', label: 'Event date: Soonest first' },
  { value: 'event_date_desc', label: 'Event date: Latest first' },
];

const MyTickets = () => {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sort, setSort] = useState('created_desc');

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchTickets();
  }, [user, token, authLoading, sort]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/tickets/my`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { sort }
      });
      setTickets(res.data.items || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (ticketId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await axios.patch(`${API_URL}/api/tickets/${ticketId}/cancel`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Booking cancelled successfully');
      fetchTickets();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error cancelling booking');
    }
  };

  if (authLoading || loading) return <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1a1a2e', margin: 0 }}>My Tickets</h1>
        {tickets.length > 0 && (
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '0.9rem' }}
          >
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>
      {message && (
        <div style={{ background: '#f0e6ff', color: '#a970ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>
          {message}
        </div>
      )}
      {tickets.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>No tickets yet. <Link to="/events" style={{ color: '#a970ff' }}>Browse events</Link></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map(ticket => {
            const sc = statusColors[ticket.status] || statusColors.confirmed;
            const eventStarted = ticket.starts_at && new Date(ticket.starts_at) <= new Date();
            return (
              <div key={ticket.id} style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' }}>{ticket.title}</h3>
                  {ticket.ticket_type_name && (
                    <p style={{ color: '#a970ff', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>{ticket.ticket_type_name}</p>
                  )}
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>📍 {ticket.venue}{ticket.city ? `, ${ticket.city}` : ''}</p>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>📅 {new Date(ticket.starts_at).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '800', color: '#a970ff', fontSize: '1.2rem', margin: 0 }}>${ticket.total_price}</p>
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: '2px 0 8px' }}>x{ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}</p>
                  <span style={{ background: sc.bg, color: sc.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                    {ticket.status}
                  </span>
                  {ticket.status === 'confirmed' && !eventStarted && (
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => handleCancel(ticket.id)}
                        style={{ background: 'none', border: '1px solid #e03131', color: '#e03131', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                  {ticket.status === 'confirmed' && eventStarted && (
                    <p style={{ color: '#aaa', fontSize: '0.78rem', marginTop: '10px', fontStyle: 'italic' }}>Event has started</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTickets;