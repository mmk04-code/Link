import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileSignature } from 'lucide-react';
import '../styles/ContractsPage.css';

const STATUS_STYLES = {
  draft:     { bg: '#1a1a2e', color: 'var(--text-muted)' },
  active:    { bg: 'var(--green-dim)', color: 'var(--green)' },
  completed: { bg: 'var(--blue-dim)', color: 'var(--blue)' },
  cancelled: { bg: 'var(--red-dim)', color: 'var(--red)' },
  disputed:  { bg: 'var(--amber-dim)', color: 'var(--amber)' },
};

function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access');
      if (!token) { navigate('/'); return; }

      const [userRes, contractsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/users/me/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/contracts/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const userRole = userRes.data.role || '';
      setRole(userRole);

      const list = Array.isArray(contractsRes.data)
        ? contractsRes.data
        : contractsRes.data?.results || [];
      setContracts(list);
    } catch (err) {
      console.error('Contracts fetch error:', err);
      setError('Unable to load contracts.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  if (loading) return (
    <div className="cp-loading">
      <div className="cp-spinner" />
      <span>Loading contracts…</span>
    </div>
  );

  if (error) return (
    <div className="cp-error">
      <p>{error}</p>
      <button onClick={fetchContracts}>Retry</button>
    </div>
  );

  return (
    <div className="cp-wrapper">
      <div className="cp-header">
        <h2>Contracts</h2>
        <p>{role === 'CLIENT' ? 'Contracts for your projects' : 'Your freelance contracts'}</p>
      </div>

      {contracts.length === 0 ? (
        <div className="cp-empty">
          <FileSignature className="cp-empty-icon" size={36} strokeWidth={1.9} />
          <h3>No contracts yet</h3>
          {role === 'CLIENT'
            ? <button className="cp-cta" onClick={() => navigate('/projects/create')}>Post a Project</button>
            : <button className="cp-cta" onClick={() => navigate('/projects')}>Browse Projects</button>
          }
        </div>
      ) : (
        <div className="cp-list">
          {contracts.map(c => {
            const statusStyle = STATUS_STYLES[c.status] || STATUS_STYLES.draft;
            const otherParty = role === 'CLIENT'
              ? (c.freelancer_name || c.freelancer || 'Freelancer')
              : (c.client_name || c.client || 'Client');
            return (
              <div key={c.id} className="cp-card" onClick={() => navigate(`/contracts/${c.id}`)}>
                <div className="cp-card-top">
                  <span className="cp-title">{c.title}</span>
                  <span className="cp-status-badge" style={statusStyle}>{c.status}</span>
                </div>
                <div className="cp-party">with {otherParty}</div>
                <div className="cp-budget">₹{Number(c.budget || 0).toLocaleString()}</div>
                <button
                  className="cp-open-btn"
                  onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${c.id}`); }}
                >
                  Open Contract
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ContractsPage;
