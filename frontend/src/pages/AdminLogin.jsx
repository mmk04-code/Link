import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminLogin.css';

function AdminLogin() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tokenRes = await axios.post('http://127.0.0.1:8000/api/token/', {
        email: credentials.email,
        password: credentials.password,
      });

      const access = tokenRes.data?.access;
      const refresh = tokenRes.data?.refresh;
      const adminCheckRes = await axios.get('http://127.0.0.1:8000/api/admin/dashboard/', {
        headers: { Authorization: `Bearer ${access}` },
      });

      if (!adminCheckRes?.data) {
        throw new Error('Admin verification failed');
      }

      localStorage.setItem('adminAccess', access);
      localStorage.setItem('adminRefresh', refresh || '');
      localStorage.setItem('adminRole', 'ADMIN');
      localStorage.setItem('role', 'ADMIN');
      localStorage.setItem('username', credentials.email || 'Admin');
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Admin login failed:', err);
      localStorage.removeItem('adminAccess');
      localStorage.removeItem('adminRefresh');
      localStorage.removeItem('adminRole');
      setError('Invalid admin credentials or insufficient privileges.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Admin Portal</h2>
          <p>Secure access for administrators only</p>
        </div>

        {error && (
          <div className="admin-error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="admin@link.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/login">Back to User Login</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
