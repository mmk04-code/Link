import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ProjectDetails.css';

function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myProposal, setMyProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getUserRole = useCallback(async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) return;
      const response = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(response.data.role);
      setCurrentUserId(response.data.id);
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  }, []);

  const fetchProject = useCallback(async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/');
        return;
      }
      const response = await axios.get(`http://127.0.0.1:8000/api/projects/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProject();
    getUserRole();
  }, [fetchProject, getUserRole]);

  useEffect(() => {
    const fetchMyProposal = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token || !id || userRole !== 'FREELANCER') return;

        const response = await axios.get('http://127.0.0.1:8000/api/proposals/my/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const mine = (Array.isArray(response.data) ? response.data : []).find(
          (proposal) => Number(proposal.project) === Number(id)
        );
        setMyProposal(mine || null);
      } catch (error) {
        console.error('Error fetching my proposal status:', error);
      }
    };

    fetchMyProposal();
  }, [id, userRole]);

  const proposalsCount = Number(project?.proposals_count || 0);
  const proposalLimit = Number(project?.max_proposals) || 50;
  const proposalProgress = Math.min((proposalsCount / proposalLimit) * 100, 100);
  const proposalsClosed = !project?.can_accept_proposals;
  const proposalBlockReason = project?.proposal_block_reason || 'Proposals are closed';
  const isProjectOwner = Number(currentUserId) === Number(project?.client);

  if (loading) return (
    <div className="pd-loading">
      <div className="btn-spinner" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div>
    </div>
  );
  if (!project) return (
    <div className="pd-error">
      <div className="empty-icon">⚠️</div>
      <h3>Project not found</h3>
      <button className="btn-back" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="pd-page-wrapper">
      
      <button className="pd-back-btn" onClick={() => navigate(-1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <div className="pd-two-column">
        {/* LEFT COLUMN — main project card */}
        <div className="pd-main-card">
          <h1 className="pd-title">{project.title}</h1>

          <div className="pd-meta-row">
            <div className="pd-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="meta-lbl">Posted by</span>
              <span className="meta-val">{project.client_name || 'Client'}</span>
            </div>
            
            <div className="pd-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span className="meta-lbl">Budget</span>
              <span className="meta-val">
                {(project.bid_type || 'flexible') === 'fixed'
                  ? `₹${parseFloat(project.budget_max).toFixed(0)}`
                  : `₹${parseFloat(project.budget_min).toFixed(0)} - ₹${parseFloat(project.budget_max).toFixed(0)}`}
              </span>
            </div>

            <div className="pd-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="meta-lbl">Duration</span>
              <span className="meta-val">{project.duration_days} days</span>
            </div>

            <div className="pd-meta-item">
              <span className="meta-lbl" style={{ marginLeft: 0 }}>Status</span>
              <span className={`pd-status-pill st-${project.status}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <h3 className="pd-section-label">Description</h3>
          <div className="pd-desc-text">
            {project.description}
          </div>

          <h3 className="pd-section-label" style={{ marginTop: '20px' }}>Skills Required</h3>
          <div className="pd-skills-row">
            {project.skills_required && project.skills_required.split(',').map((skill, index) => {
              if (!skill.trim()) return null;
              return <span key={index} className="pd-skill-tag">{skill.trim()}</span>;
            })}
          </div>
        </div>

        {/* RIGHT COLUMN — action card */}
        <div className="pd-action-card">
          <div className="pd-budget-label">Estimated Budget</div>
          <div className="pd-budget-value">
            {(project.bid_type || 'flexible') === 'fixed'
              ? `₹${parseFloat(project.budget_max).toFixed(0)}`
              : `₹${parseFloat(project.budget_min).toFixed(0)} - ₹${parseFloat(project.budget_max).toFixed(0)}`}
          </div>
          
          <div className="pd-divider"></div>

          <div className="pd-summary-row">
            <span className="lbl">Duration</span>
            <span className="val">{project.duration_days} days</span>
          </div>
          <div className="pd-summary-row">
            <span className="lbl">Deadline</span>
            <span className="val">
              {project.deadline_type === 'fixed' && project.submission_deadline
                ? `Fixed (${project.submission_deadline})`
                : 'Flexible'}
            </span>
          </div>
          <div className="pd-summary-row">
            <span className="lbl">Proposals Limit</span>
            <span className="val">{proposalLimit} Maximum</span>
          </div>

          <div className="pd-proposal-capacity">
            <div className="capacity-label">Proposal Capacity</div>
            <div className="capacity-track">
              <div className="capacity-fill" style={{ width: `${proposalProgress}%` }}></div>
            </div>
            <div className="capacity-count">{proposalsCount} / {proposalLimit} proposals submitted</div>
            {proposalsClosed && <div className="capacity-closed">{proposalBlockReason}</div>}
          </div>

          {userRole === 'FREELANCER' && project.status === 'open' && !isProjectOwner && (
            <>
              {myProposal ? (
                <div className="pd-applied-wrap">
                  <span className="pd-applied-pill">Applied ✓</span>
                  <div className="pd-applied-meta">
                    <span>Bid: ₹{Number(myProposal.bid_amount || 0).toFixed(2)}</span>
                    <span className={`status-pill ${(myProposal.status || '').toLowerCase()}`}>
                      {(myProposal.status || 'pending').toLowerCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  className="pd-btn-primary"
                  disabled={proposalsClosed}
                  title={proposalsClosed ? proposalBlockReason : ''}
                  onClick={() => navigate(`/proposals/create/${id}`)}
                >
                  Submit Proposal
                </button>
              )}
            </>
          )}
          {isProjectOwner && (
            <button
              className="pd-btn-secondary"
              onClick={() => navigate('/projects/create')}
              style={{ marginTop: '16px' }}
            >
              Edit Project
            </button>
          )}
          {userRole === 'CLIENT' && !isProjectOwner && (
            <button 
              className="pd-btn-secondary"
              onClick={() => navigate(`/projects`)}
              style={{ marginTop: '16px' }}
            >
              Back to My Projects
            </button>
          )}

          <div className="pd-client-section">
            <div className="pd-client-label">About the Client</div>
            <div className="pd-client-row">
              <div className="pd-client-avatar">
                {project.client_name ? project.client_name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="pd-client-info">
                <div className="name">{project.client_name || 'Client Name'}</div>
                <div className="since">Member since 2024</div>
              </div>
            </div>

            {userRole === 'FREELANCER' && project.client_reputation && (
              <div className="pd-trust-card">
                <div className="pd-trust-title">Client reputation from freelancers</div>
                <div className="pd-trust-metrics">
                  <span>{Number(project.client_reputation.average_rating || 0).toFixed(1)}★ rating</span>
                  <span>{Number(project.client_reputation.total_reviews || 0)} review{Number(project.client_reputation.total_reviews || 0) === 1 ? '' : 's'}</span>
                  <span>{Number(project.client_reputation.recommendation_rate || 0).toFixed(0)}% recommend</span>
                </div>

                {Array.isArray(project.client_recent_reviews) && project.client_recent_reviews.length > 0 && (
                  <div className="pd-trust-subsection">
                    <div className="pd-trust-subtitle">Recent feedback</div>
                    <ul className="pd-trust-list">
                      {project.client_recent_reviews.map((review) => (
                        <li key={review.id}>
                          <div className="pd-trust-list-top">
                            <strong>{review.reviewer_name}</strong>
                            <span>{Number(review.rating || 0).toFixed(1)}★</span>
                          </div>
                          <div className="pd-trust-list-title">{review.contract_title}</div>
                          <div className="pd-trust-list-comment">{review.title || review.comment || 'Review available'}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(project.client_recent_completed_projects) && project.client_recent_completed_projects.length > 0 && (
                  <div className="pd-trust-subsection">
                    <div className="pd-trust-subtitle">Recent completed work</div>
                    <ul className="pd-trust-list">
                      {project.client_recent_completed_projects.map((item) => (
                        <li key={item.contract_id}>
                          <div className="pd-trust-list-top">
                            <strong>{item.project_title}</strong>
                            <span>₹{Number(item.budget || 0).toLocaleString()}</span>
                          </div>
                          <div className="pd-trust-list-comment">Freelancer: {item.freelancer_name}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
