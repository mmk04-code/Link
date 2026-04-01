import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import '../styles/AdminContracts.css';

const AdminContracts = () => {
  const [data, setData] = useState({ stats: {}, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const token = localStorage.getItem('adminAccess');
        if (!token) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const response = await api.get('/admin/contracts/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data || { stats: {}, results: [] });
      } catch (err) {
        console.error('Failed to load contracts', err);
        setError('Unable to load contracts.');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const filteredContracts = useMemo(() => {
    return (data.results || []).filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.client?.toLowerCase().includes(q) ||
        item.freelancer?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [data.results, statusFilter, searchTerm]);

  if (loading) {
    return <div className="admin-loading">Loading contracts...</div>;
  }

  return (
    <AdminLayout onSearch={setSearchTerm}>
      <div className="admin-contracts-page">
        <div className="page-header">
          <h1>Contracts</h1>
          <p>Monitor all contracts across the platform</p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="stats-cards">
          <div className="stat-card"><span>Total</span><strong>{data.stats?.total ?? 0}</strong></div>
          <div className="stat-card"><span>Active</span><strong>{data.stats?.active ?? 0}</strong></div>
          <div className="stat-card"><span>Completed</span><strong>{data.stats?.completed ?? 0}</strong></div>
          <div className="stat-card"><span>Disputed</span><strong>{data.stats?.disputed ?? 0}</strong></div>
        </div>

        <div className="filter-tabs">
          {['all', 'draft', 'active', 'completed', 'cancelled', 'disputed'].map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? 'active' : ''}
              onClick={() => setStatusFilter(status)}
            >
              {status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Freelancer</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.title}</td>
                  <td>{contract.client}</td>
                  <td>{contract.freelancer}</td>
                  <td>${Number(contract.budget || 0).toLocaleString()}</td>
                  <td><span className={`status ${contract.status}`}>{contract.status}</span></td>
                  <td>{contract.created_at ? new Date(contract.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredContracts.length && <p className="empty-text">No contracts found.</p>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContracts;
