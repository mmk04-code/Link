import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import '../styles/AdminVerifications.css';

const FILTERS = ['pending', 'approved', 'rejected', 'expired'];

function AdminVerifications() {
  const [filter, setFilter] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('adminAccess');

  const fetchRequests = async (nextFilter = filter) => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/users/verification/admin/requests/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: nextFilter },
      });
      const list = Array.isArray(res.data?.results) ? res.data.results : [];
      setRequests(list);
      if (list.length > 0) {
        const current = list.find((r) => r.id === selected?.id);
        setSelected(current || list[0]);
      } else {
        setSelected(null);
      }
    } catch (e) {
      setError('Unable to load verification requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((item) => {
      const haystack = [
        item.username || '',
        item.user_email || '',
        item.role || '',
        item.status || '',
        item.profile?.full_name || '',
        item.profile?.location || '',
        item.profile?.skills || '',
        item.profile?.company_name || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [requests, searchTerm]);

  useEffect(() => {
    if (!filteredRequests.length) {
      setSelected(null);
      return;
    }
    if (!selected || !filteredRequests.some((item) => item.id === selected.id)) {
      setSelected(filteredRequests[0]);
    }
  }, [filteredRequests, selected]);

  const submitDecision = async (decision) => {
    if (!selected || !token) return;
    try {
      setDeciding(true);
      await api.post(`/users/verification/requests/${selected.id}/decision/`, { decision }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRequests(filter);
    } catch (e) {
      alert(e?.response?.data?.detail || 'Unable to submit decision.');
    } finally {
      setDeciding(false);
    }
  };

  return (
    <AdminLayout onSearch={setSearchTerm}>
      <div className="admin-verifications-page">
        <div className="av-header">
          <h1>Verification Requests</h1>
          <p>Review users and verify trusted clients/freelancers.</p>
        </div>

        <div className="av-filter-row">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`av-filter-btn ${filter === item ? 'active' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="av-loading">Loading verification requests...</div>
        ) : error ? (
          <div className="av-error">{error}</div>
        ) : (
          <div className="av-grid">
            <div className="av-list">
              {filteredRequests.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`av-list-item ${selected?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelected(item)}
                >
                  <div className="av-list-top">
                    <strong>{item.profile?.full_name || item.username}</strong>
                    <span className={`status ${item.status}`}>{item.status}</span>
                  </div>
                  <div className="av-list-sub">{item.user_email}</div>
                  <div className="av-list-sub">Role: {item.role}</div>
                </button>
              ))}
              {filteredRequests.length === 0 && <p className="av-empty">No requests found for this filter.</p>}
            </div>

            <div className="av-detail">
              {!selected ? (
                <p className="av-empty">Select a request to view profile details.</p>
              ) : (
                <>
                  <div className="av-detail-head">
                    <h3>{selected.profile?.full_name || selected.username}</h3>
                    <span className={`status ${selected.status}`}>{selected.status}</span>
                  </div>

                  <div className="av-info-grid">
                    <div><label>Email</label><p>{selected.user_email}</p></div>
                    <div><label>Role</label><p>{selected.role}</p></div>
                    <div><label>Location</label><p>{selected.profile?.location || '-'}</p></div>
                    <div><label>Skills</label><p>{selected.profile?.skills || '-'}</p></div>
                    <div><label>Company</label><p>{selected.profile?.company_name || '-'}</p></div>
                    <div><label>LinkedIn</label><p>{selected.profile?.linkedin_url || '-'}</p></div>
                  </div>

                  <div className="av-bio">
                    <label>Bio</label>
                    <p>{selected.profile?.bio || 'No bio provided.'}</p>
                  </div>

                  {selected.status === 'pending' && (
                    <div className="av-actions">
                      <button type="button" className="approve" disabled={deciding} onClick={() => submitDecision('approve')}>
                        Approve Verification
                      </button>
                      <button type="button" className="reject" disabled={deciding} onClick={() => submitDecision('reject')}>
                        Reject
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminVerifications;
