import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ events: 0, tickets: 0, cities: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eventsRes, ticketsRes] = await Promise.all([
          axios.get(`${API_URL}/api/events`, { params: { limit: 1 } }),
          axios.get(`${API_URL}/api/stats`),
        ]);
        const totalEvents = eventsRes.data.total || 0;
        setStats({
          events: totalEvents,
          tickets: ticketsRes.data.tickets || 0,
          cities: ticketsRes.data.cities || 0,
        });
      } catch {
        // fallback to defaults
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-icon">🎟️</div>
          <h1>Find & Book Amazing Events</h1>
          <p>Discover concerts, conferences, festivals and more. Book your tickets in seconds.</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn-primary">Browse Events</Link>
            {!user && <Link to="/register" className="btn-secondary">Get Started</Link>}
          </div>
        </div>
      </section>

      <section className="stats-bar">
        <div className="stat"><span className="stat-number">{stats.events}</span><span className="stat-label">Events</span></div>
        <div className="stat"><span className="stat-number">{stats.cities}</span><span className="stat-label">Cities</span></div>
        <div className="stat"><span className="stat-number">{stats.tickets}</span><span className="stat-label">Tickets Sold</span></div>
      </section>

      <section className="categories">
        <h2>Browse by Category</h2>
        <div className="category-grid">
          {[
            { name: 'Concerts', icon: '🎵', value: 'concert' },
            { name: 'Conferences', icon: '💼', value: 'conference' },
            { name: 'Festivals', icon: '🎪', value: 'festival' },
            { name: 'Sports', icon: '⚽', value: 'sports' },
          ].map(cat => (
            <Link to={`/events?category=${cat.value}`} key={cat.value} className="category-card">
              <span className="category-icon">{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;