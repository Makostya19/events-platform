import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MyTickets = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchTickets();
  }, [user, token]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tickets/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px', color: '#1a1a2e' }}>My Tickets</h1>
      {tickets.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>No tickets yet. <Link to="/events" style={{ color: '#a970ff' }}>Browse events</Link></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' }}>{ticket.title}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>📍 {ticket.location}</p>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>📅 {new Date(ticket.event_date).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '800', color: '#a970ff', fontSize: '1.2rem' }}>${ticket.total_price}</p>
                <p style={{ color: '#888', fontSize: '0.85rem' }}>x{ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}</p>
                <span style={{ background: '#f0fff4', color: '#2f9e44', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;