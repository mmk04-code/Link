import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import '../styles/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoadingById, setActionLoadingById] = useState({});

  const handleRoleFilterChange = (role) => {
    setFilter(role);
  };

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccess');
      if (!token) {
        return;
      }

      const response = await api.get('/admin/users/stats/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data || {});
    } catch (err) {
      console.error('Failed to load user stats', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccess');
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      const response = await api.get('/admin/users/', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          role: filter,
        },
      });
      setUsers(response.data?.results || []);
    } catch (err) {
      console.error('Failed to load users', err);
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const canRemoveUser = (user) => user?.role === 'CLIENT' || user?.role === 'FREELANCER';

  const removeUser = async (user) => {
    if (!canRemoveUser(user)) return;

    const confirmation = window.confirm(`Remove ${user.username}? This will deactivate the account.`);
    if (!confirmation) return;

    setActionLoadingById((prev) => ({ ...prev, [user.id]: true }));

    try {
      const token = localStorage.getItem('adminAccess');
      await api.post(
        `/admin/users/${user.id}/action/`,
        { action: 'remove' },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      alert(err?.response?.data?.error || 'Unable to remove user.');
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const tableUsers = useMemo(() => users, [users]);

  if (loading) {
    return <div className="admin-loading">Loading users...</div>;
  }

  return (
    <AdminLayout onSearch={setSearch}>
      <div className="admin-users-page">
        <div className="page-header">
          <h1>Users</h1>
          <p>Manage all clients and freelancers</p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="stats-cards">
          <button
            type="button"
            className={`stat-card stat-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleRoleFilterChange('all')}
          >
            <span>Total</span>
            <strong>{stats?.total ?? 0}</strong>
          </button>
          <button
            type="button"
            className={`stat-card stat-button ${filter === 'client' ? 'active' : ''}`}
            onClick={() => handleRoleFilterChange('client')}
          >
            <span>Clients</span>
            <strong>{stats?.clients ?? 0}</strong>
          </button>
          <button
            type="button"
            className={`stat-card stat-button ${filter === 'freelancer' ? 'active' : ''}`}
            onClick={() => handleRoleFilterChange('freelancer')}
          >
            <span>Freelancers</span>
            <strong>{stats?.freelancers ?? 0}</strong>
          </button>
          <div className="stat-card">
            <span>Verified</span>
            <strong>{stats?.verified ?? 0}</strong>
          </div>
        </div>

        <div className="filter-tabs">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => handleRoleFilterChange('all')}>
            All
          </button>
          <button
            type="button"
            className={filter === 'client' ? 'active' : ''}
            onClick={() => handleRoleFilterChange('client')}
          >
            Clients
          </button>
          <button
            type="button"
            className={filter === 'freelancer' ? 'active' : ''}
            onClick={() => handleRoleFilterChange('freelancer')}
          >
            Freelancers
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role === 'CLIENT' ? 'Client' : user.role === 'FREELANCER' ? 'Freelancer' : user.role}</td>
                  <td>{user.is_verified ? 'Yes' : 'No'}</td>
                  <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                  <td>{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : '-'}</td>
                  <td>
                    {canRemoveUser(user) ? (
                      <button
                        type="button"
                        className="admin-user-remove-btn"
                        disabled={!user.is_active || actionLoadingById[user.id]}
                        onClick={() => removeUser(user)}
                      >
                        {actionLoadingById[user.id] ? 'Removing...' : user.is_active ? 'Remove' : 'Removed'}
                      </button>
                    ) : (
                      <span className="admin-user-action-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tableUsers.length && <p className="empty-text">No users found.</p>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
