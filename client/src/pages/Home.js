import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { TicketIcon, MusicIcon, BriefcaseIcon, FestivalIcon, SportsIcon } from '../components/Icons';
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
          <div className="hero-mark"><TicketIcon width={40} height={40} /></div>
          <h1>Seoul has plans for you.</h1>
          <p>Live music, festivals, and talks worth leaving home for.</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn-primary">Browse all events</Link>
            {!user && <Link to="/register" className="btn-secondary">Create free account</Link>}
          </div>
        </div>
      </section>

      <section className="stats-bar">
        <div className="stat"><span className="stat-number">{stats.events}</span><span className="stat-label">Events</span></div>
        <div className="stat"><span className="stat-number">{stats.cities}</span><span className="stat-label">Cities</span></div>
        <div className="stat"><span className="stat-number">{stats.tickets}</span><span className="stat-label">Tickets sold</span></div>
      </section>

      <section className="categories">
        <h2>Pick your scene</h2>
        <div className="category-grid">
          <Link to="/events?category=concert" className="category-card">
            <span className="category-icon"><MusicIcon width={28} height={28} /></span>
            <span>Concerts</span>
          </Link>
          <Link to="/events?category=conference" className="category-card">
            <span className="category-icon"><BriefcaseIcon width={28} height={28} /></span>
            <span>Conferences</span>
          </Link>
          <Link to="/events?category=festival" className="category-card">
            <span className="category-icon"><FestivalIcon width={28} height={28} /></span>
            <span>Festivals</span>
          </Link>
          <Link to="/events?category=sports" className="category-card">
            <span className="category-icon"><SportsIcon width={28} height={28} /></span>
            <span>Sports</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;