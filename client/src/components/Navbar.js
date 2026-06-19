import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🎟️ Events Platform</Link>
      <div className="navbar-links">
        <Link to="/events">Events</Link>
        {user && <Link to="/favorites">Favorites</Link>}
        {user && <Link to="/my-tickets">My Tickets</Link>}
        {user?.role === 'admin' && <Link to="/admin" className="admin-link">Admin</Link>}
        {user ? (
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;