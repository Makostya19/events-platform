import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMenu}>🎟️ Events Platform</Link>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen(o => !o)}
        aria-expanded={menuOpen}
        aria-controls="navbar-menu"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="navbar-toggle-icon" aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
      </button>

      <div id="navbar-menu" className={menuOpen ? 'navbar-links open' : 'navbar-links'}>
        <Link to="/events" onClick={closeMenu}>Events</Link>
        {user && <Link to="/favorites" onClick={closeMenu}>Favorites</Link>}
        {user && <Link to="/my-tickets" onClick={closeMenu}>My Tickets</Link>}
        {user && <Link to="/profile" onClick={closeMenu}>Profile</Link>}
        {user?.role === 'admin' && <Link to="/admin" className="admin-link" onClick={closeMenu}>Admin</Link>}
        {user ? (
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link to="/register" className="btn-register" onClick={closeMenu}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;