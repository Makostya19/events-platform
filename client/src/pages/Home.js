import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

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
        <div className="stat"><span className="stat-number">100+</span><span className="stat-label">Events</span></div>
        <div className="stat"><span className="stat-number">50+</span><span className="stat-label">Cities</span></div>
        <div className="stat"><span className="stat-number">10k+</span><span className="stat-label">Tickets Sold</span></div>
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