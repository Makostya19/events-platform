import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');

    if (token && userParam) {
      const user = JSON.parse(decodeURIComponent(userParam));
      login(token, user);
      navigate('/');
    } else {
      navigate('/login?error=google_failed');
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
      Signing you in...
    </div>
  );
};

export default OAuthCallback;