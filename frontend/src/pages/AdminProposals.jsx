import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import '../styles/AdminProposals.css';

const AdminProposals = () => {
  const [data, setData] = useState({ stats: {}, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccess');
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      const response = await api.get('/admin/proposals/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || { stats: {}, results: [] });
    } catch (err) {
      console.error('Failed to load admin proposals', err);
      setError('Unable to load proposals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const filteredProposals = useMemo(() => {
    return (data.results || []).filter((proposal) => {
      const matchesFilter = filter === 'all' || proposal.status === filter;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        proposal.title?.toLowerCase().includes(q) ||
        proposal.freelancer?.toLowerCase().includes(q) ||
        proposal.client?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [data.results, filter, searchTerm]);

  // CLIENT-only action — removed

  if (loading) {
    return <div className="admin-loading">Loading proposals...</div>;
  }

  return (
    <AdminLayout onSearch={setSearchTerm}>
      <div className="admin-proposals">
        <div className="page-header">
          <h1>Proposals</h1>
          <p>Track and manage all submitted project proposals</p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-label">Total Submitted</span>
            <span className="stat-value">{data.stats?.total ?? 0}</span>
          </div>
          <div className="stat-card accepted">
            <span className="stat-label">Accepted</span>
            <span className="stat-value">{data.stats?.accepted ?? 0}</span>
          </div>
          <div className="stat-card rejected">
            <span className="stat-label">Rejected</span>
            <span className="stat-value">{data.stats?.rejected ?? 0}</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{data.stats?.pending ?? 0}</span>
          </div>
        </div>

        <div className="filter-tabs">
          {['all', 'pending', 'accepted', 'rejected'].map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-btn ${filter === item ? 'active' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <div className="proposals-list">
          {filteredProposals.map((proposal) => (
            <div key={proposal.id} className="proposal-card">
              <div className="proposal-header">
                <h3>{proposal.title}</h3>
                <span className={`status-badge ${proposal.status}`}>{proposal.status}</span>
              </div>

              <div className="proposal-meta-grid">
                <div className="meta-item">
                  <div className="meta-label">Freelancer</div>
                  <div className="meta-value">{proposal.freelancer || '-'}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Client</div>
                  <div className="meta-value">{proposal.client || '-'}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Bid Amount</div>
                  <div className="meta-value">₹{Number(proposal.bid_amount || 0).toLocaleString()}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Date</div>
                  <div className="meta-value date-with-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{proposal.submitted_date ? new Date(proposal.submitted_date).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
              </div>

              <p className={`proposal-description ${expandedId === proposal.id ? 'expanded' : ''}`}>
                {proposal.description || '-'}
              </p>
              <button
                type="button"
                className="toggle-cover"
                onClick={() => setExpandedId(expandedId === proposal.id ? null : proposal.id)}
              >
                {expandedId === proposal.id ? 'Show less' : 'Show more'}
              </button>

              <div className="proposal-footer">
                <div className="actions">
                  <button
                    type="button"
                    className="btn-view"
                    onClick={() => setExpandedId(expandedId === proposal.id ? null : proposal.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!filteredProposals.length && <p className="empty-text">No proposals found.</p>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProposals;
