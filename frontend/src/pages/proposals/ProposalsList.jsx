import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ProposalsList.css';

function ProposalsList() {
  const [proposals, setProposals] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/');
        return;
      }

      const userRes = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(userRes.data.role);

      const res = await axios.get('http://127.0.0.1:8000/api/proposals/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProposals(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    const token = localStorage.getItem('access');
    try {
      await axios.patch(`http://127.0.0.1:8000/api/proposals/${id}/`,
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Backend automatically rejects other proposals, re-fetch data
      fetchData();
    } catch (error) {
      console.error('Error accepting proposal:', error);
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem('access');
    try {
      await axios.patch(`http://127.0.0.1:8000/api/proposals/${id}/`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error('Error rejecting proposal:', error);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading proposals...</div>;

  return (
    <div className="proposals-page-container">
      <div className="proposals-list-wrapper">
        {proposals.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "40px", color: "#666" }}>
            No proposals found.
          </div>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="proposal-card">
              <div className="proposal-header">
                <h3 className="proposal-title">{p.project_title}</h3>
                <span className={`status-badge ${p.status}`}>
                  {p.status}
                </span>
              </div>

              <div className="proposal-details">
                <div className="detail-row">
                  <span className="detail-label">Freelancer:</span>
                  <span className="detail-value">{p.freelancer_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Bid Amount:</span>
                  <span className="detail-value">₹{parseFloat(p.bid_amount).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{p.estimated_days} days</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cover Letter:</span>
                  <span className="detail-value">{p.cover_letter}</span>
                </div>
              </div>

              {userRole === 'CLIENT' && p.status === 'pending' && (
                <div className="proposal-actions">
                  <button className="btn-accept" onClick={() => handleAccept(p.id)}>Accept</button>
                  <button className="btn-reject" onClick={() => handleReject(p.id)}>Reject</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProposalsList;
