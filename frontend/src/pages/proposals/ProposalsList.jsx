import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Clock3 } from 'lucide-react';
import '../../styles/ProposalsList.css';

function ProposalsList() {
  const [proposals, setProposals] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [clientBidInputs, setClientBidInputs] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/');
        return;
      }

      const userRes = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const role = userRes.data.role;
      setUserRole(role);

      const endpoint = role === 'CLIENT'
        ? 'http://127.0.0.1:8000/api/proposals/received/'
        : 'http://127.0.0.1:8000/api/proposals/my/';

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setProposals(list);

      if (role === 'CLIENT') {
        const seed = {};
        list.forEach((p) => {
          seed[p.id] = p.bid_amount;
        });
        setClientBidInputs(seed);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Unable to load proposals right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (id) => {
    if (userRole === 'CLIENT') {
      const entered = clientBidInputs[id];
      const amount = Number.parseFloat(entered);
      if (!Number.isFinite(amount) || amount <= 0) {
        alert('Please enter a valid amount before continuing.');
        return;
      }
      navigate(`/contracts/new/${id}?bid_amount=${encodeURIComponent(String(amount))}`);
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem('access');
    try {
      await axios.post(`http://127.0.0.1:8000/api/proposals/${id}/reject/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (error) {
      console.error('Error rejecting proposal:', error?.response?.data || error);
      alert('Failed to reject proposal: ' + (error?.response?.data?.error || error.message));
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getCardAvatar = (proposal) => {
    return userRole === 'CLIENT'
      ? (proposal.freelancer_profile_image || '')
      : (proposal.client_profile_image || '');
  };

  const visibleProposals = useMemo(() => {
    let list = [...proposals];

    if (userRole === 'FREELANCER' && statusFilter !== 'all') {
      list = list.filter((p) => (p.status || '').toLowerCase() === statusFilter);
    }

    list.sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return sortFilter === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [proposals, userRole, statusFilter, sortFilter]);

  if (loading) return (
    <div className="proposals-loading">
      <div className="btn-spinner" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent', width: '24px', height: '24px' }}></div>
      <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>Loading proposals...</span>
    </div>
  );

  if (error) {
    return (
      <div className="proposals-page-wrapper">
        <div className="proposals-error-wrap">
          <p className="proposals-error-text">{error}</p>
          <button className="proposals-retry-btn" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="proposals-page-wrapper">
      <div className="proposals-header">
        <h2>{userRole === 'CLIENT' ? 'Received Proposals' : 'My Proposals'}</h2>
        <p>Manage and track all proposal activities</p>

        {userRole === 'FREELANCER' && (
          <div className="proposals-toolbar">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>

            <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        )}
      </div>

      <div className="proposals-list-container">
        {visibleProposals.length === 0 ? (
          <div className="proposals-empty">
            <div className="empty-icon"><FileText size={30} strokeWidth={2} /></div>
            <h3>No proposals found</h3>
            <p>We couldn't find any proposals matching your query.</p>
          </div>
        ) : (
          visibleProposals.map((p) => (
            <div key={p.id} className="saas-proposal-card">
              
              <div className="spc-top-row">
                <div className="spc-user">
                  <div className="spc-avatar">
                    {getCardAvatar(p) ? (
                      <img
                        className="spc-avatar-img"
                        src={getCardAvatar(p)}
                        alt={userRole === 'CLIENT' ? (p.freelancer_name || 'Freelancer') : (p.client_name || 'Client')}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span style={{ display: getCardAvatar(p) ? 'none' : 'flex' }}>
                      {getInitials(userRole === 'CLIENT' ? p.freelancer_name : p.client_name)}
                    </span>
                  </div>
                  <div className="spc-user-info">
                    <span className="spc-name">
                      {userRole === 'CLIENT'
                        ? (p.freelancer_name || 'Freelancer')
                        : (p.client_name || 'Client')}
                    </span>
                  </div>
                </div>

                <div className="spc-budget-status">
                  <div className="spc-budget-wrap">
                    {userRole === 'CLIENT' && p.status === 'pending' ? (
                      <div className="spc-bid-edit-wrap">
                        <label className="spc-bid-edit-label">Amount (editable)</label>
                        <div className="spc-bid-edit-input-wrap">
                          <span className="spc-bid-currency">₹</span>
                          <input
                            className="spc-bid-edit-input"
                            type="number"
                            min="1"
                            step="0.01"
                            value={clientBidInputs[p.id] ?? p.bid_amount}
                            onChange={(e) => setClientBidInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="spc-budget">₹{parseFloat(p.bid_amount).toFixed(2)}</span>
                    )}
                    <span className="spc-budget-type">/ project</span>
                  </div>
                  <span className={`status-pill ${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="spc-middle">
                <div className="spc-project-title">Project: {p.project_title}</div>
                {userRole === 'CLIENT' && p.freelancer_reputation && (
                  <div className="spc-reputation-block">
                    <div className="spc-reputation-head">
                      <span className="spc-reputation-score">{Number(p.freelancer_reputation.average_rating || 0).toFixed(1)}★</span>
                      <span className="spc-reputation-meta">
                        {Number(p.freelancer_reputation.total_reviews || 0)} client review{Number(p.freelancer_reputation.total_reviews || 0) === 1 ? '' : 's'}
                      </span>
                      <span className="spc-reputation-meta">
                        {Number(p.freelancer_reputation.recommendation_rate || 0).toFixed(0)}% recommend
                      </span>
                    </div>
                    {Array.isArray(p.freelancer_reputation.recent_reviews) && p.freelancer_reputation.recent_reviews.length > 0 && (
                      <div className="spc-reputation-snippet">
                        "{p.freelancer_reputation.recent_reviews[0].title || p.freelancer_reputation.recent_reviews[0].comment || 'Recent feedback available'}"
                      </div>
                    )}
                  </div>
                )}
                
                <div className="spc-delivery">
                  <Clock3 size={14} strokeWidth={2} style={{ color: 'var(--text-faint)' }} />
                  Estimated delivery: {p.estimated_days} days
                </div>
              </div>

              <div className="spc-cover-letter">
                <p>{p.cover_letter}</p>
              </div>

              <div className="spc-bottom-row">
                <div className="spc-actions">
                  {userRole === 'CLIENT' && p.status === 'pending' && (
                    <>
                      <button className="btn-saas-accept" onClick={() => handleAccept(p.id)}>Create Contract</button>
                      <button className="btn-saas-reject" onClick={() => handleReject(p.id)}>Reject</button>
                    </>
                  )}
                  {userRole === 'FREELANCER' && p.status === 'accepted' && (
                    <button
                      className="btn-saas-accept"
                      onClick={() => p.contract_id ? navigate(`/contracts/${p.contract_id}`) : alert('Contract not created yet.')}
                    >
                      View Contract
                    </button>
                  )}
                  {userRole === 'FREELANCER' && p.status === 'pending' && (
                    <button className="btn-saas-reject">Withdraw</button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProposalsList;
