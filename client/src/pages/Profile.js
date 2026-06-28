import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Profile = () => {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!form.name || form.name.length < 2) return setError('Name must be at least 2 characters');
    setLoading(true);
    setError('');
    try {
      const res = await axios.put(`${API_URL}/api/profile`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      login(token, { ...user, name: res.data.name, email: res.data.email });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) return setError('New password must be at least 8 characters');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      await axios.put(`${API_URL}/api/profile/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #ddd', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '12px'
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '32px', color: '#1a1a2e' }}>My Profile</h1>

      {message && <div style={{ background: '#f0e6ff', color: '#a970ff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>{message}</div>}
      {error && <div style={{ background: '#fff0f0', color: '#e03131', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#a970ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: '700', color: '#1a1a2e', margin: 0, fontSize: '1.1rem' }}>{user.name}</p>
            <p style={{ color: '#888', margin: '2px 0 0', fontSize: '0.9rem' }}>{user.email}</p>
            <span style={{ background: '#eef2ff', color: '#3b5bdb', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              {user.role}
            </span>
          </div>
        </div>

        <h2 style={{ fontWeight: '700', marginBottom: '16px', color: '#1a1a2e', fontSize: '1.1rem' }}>Update Profile</h2>
        <form onSubmit={handleUpdateProfile}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Name</label>
          <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <button type="submit" disabled={loading} style={{ padding: '10px 24px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {user.provider !== 'google' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', color: '#1a1a2e', fontSize: '1.1rem' }}>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Current Password</label>
            <input style={inputStyle} type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>New Password</label>
            <input style={inputStyle} type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Confirm New Password</label>
            <input style={inputStyle} type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <button onClick={() => { logout(); navigate('/'); }} style={{ background: 'none', border: '1px solid #e03131', color: '#e03131', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;