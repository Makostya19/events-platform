import { Link } from 'react-router-dom';
import { TicketIcon } from './Icons';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-brand-mark"><TicketIcon width={20} height={20} /></span>
          <span className="footer-brand-name">Events Platform</span>
          <p className="footer-tagline">A city guide to what's on in Seoul.</p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <div className="footer-col">
            <h3>Explore</h3>
            <Link to="/events">All events</Link>
            <Link to="/events?category=concert">Concerts</Link>
            <Link to="/events?category=festival">Festivals</Link>
            <Link to="/events?category=conference">Conferences</Link>
          </div>
          <div className="footer-col">
            <h3>Account</h3>
            <Link to="/my-tickets">My tickets</Link>
            <Link to="/favorites">Favorites</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>© {year} Events Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;