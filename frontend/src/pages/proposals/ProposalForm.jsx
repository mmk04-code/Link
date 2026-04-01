import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ProposalForm.css';

function ProposalForm() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ cover_letter: '', bid_amount: '', estimated_days: '' });
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();
  const proposalsClosed = project && project.can_accept_proposals === false;
  const proposalBlockReason = project?.proposal_block_reason || 'Proposals are closed for this project.';
  const isFixedBidProject = (project?.bid_type || 'flexible') === 'fixed';
  const isFixedDeadlineProject = (project?.deadline_type || 'flexible') === 'fixed';

  const fetchProject = useCallback(async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/');
        return;
      }
      const response = await axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (proposalsClosed) {
      setSubmitError(proposalBlockReason);
      return;
    }

    const bid = Number(form.bid_amount);
    const min = Number(project?.budget_min);
    const max = Number(project?.budget_max);
    if (!isFixedBidProject) {
      if (Number.isNaN(bid)) {
        setSubmitError('Please enter your bid amount.');
        return;
      }
      if (!Number.isNaN(min) && !Number.isNaN(max) && (bid < min || bid > max)) {
        setSubmitError(`Bid is outside the allowed client range (INR ${min.toLocaleString()} - INR ${max.toLocaleString()}).`);
        return;
      }
    }

    if (!isFixedDeadlineProject) {
      const estimated = Number(form.estimated_days);
      if (Number.isNaN(estimated) || estimated <= 0) {
        setSubmitError('Please enter a valid estimated duration in days.');
        return;
      }
    }

    try {
      const token = localStorage.getItem('access');
      const payload = {
        project: projectId,
        cover_letter: form.cover_letter,
      };

      if (!isFixedBidProject) {
        payload.bid_amount = form.bid_amount;
      }

      if (!isFixedDeadlineProject) {
        payload.estimated_days = form.estimated_days;
      }

      await axios.post('http://127.0.0.1:8000/api/proposals/', {
        ...payload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Proposal submitted successfully!');
      const role = localStorage.getItem('role') || '';
      if (role.toUpperCase() === 'CLIENT') {
        navigate('/proposals');
      } else {
        navigate('/my-proposals');
      }
    } catch (error) {
      console.error('Submit error:', error);
      const backendError =
        error?.response?.data?.bid_amount?.[0] ||
        error?.response?.data?.error ||
        'Failed to submit proposal. Make sure you are a freelancer and logged in.';
      setSubmitError(backendError);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  if (!project) return <div style={{ padding: "40px", textAlign: "center" }}>Project not found</div>;

  return (
    <div className="proposal-form-container">
      <div className="proposal-form-card">
        <div className="form-header">
          <h2 className="form-title">Submit Proposal</h2>
          <p className="form-subtitle">for <strong>{project.title}</strong></p>
        </div>

        <form className="proposal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Cover Letter</label>
            <textarea
              className="form-textarea"
              name="cover_letter"
              placeholder="Explain why you're a great fit for this project..."
              value={form.cover_letter}
              onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Budget</label>
            <p className="form-helper-text">
              {isFixedBidProject ? (
                <>Client fixed budget: <strong>INR {Number(project.budget_max).toLocaleString()}</strong></>
              ) : (
                <>Client budget range: <strong>INR {Number(project.budget_min).toLocaleString()} - INR {Number(project.budget_max).toLocaleString()}</strong></>
              )}
            </p>
            <p className="form-helper-text">
              Proposal window: <strong>{project.deadline_type === 'fixed' && project.submission_deadline ? `Submit before ${project.submission_deadline}` : 'Flexible'}</strong>
            </p>
            <p className="form-helper-text">
              Proposal slots: <strong>{Number(project.proposals_count || 0)} / {Number(project.max_proposals || 50)}</strong>
            </p>
            {!isFixedBidProject && (
              <div className="input-with-symbol">
                <span className="currency-symbol">₹</span>
                <input
                  className="form-input"
                  type="number"
                  name="bid_amount"
                  placeholder="e.g. 5000"
                  value={form.bid_amount}
                  onChange={(e) => setForm({ ...form, bid_amount: e.target.value })}
                  required
                />
              </div>
            )}
          </div>

          {submitError && <p className="form-submit-error">{submitError}</p>}

          {!isFixedDeadlineProject && (
            <div className="form-group">
              <label className="form-label">Estimated Duration (Days)</label>
              <div className="input-with-suffix">
                <input
                  className="form-input"
                  type="number"
                  name="estimated_days"
                  placeholder="e.g. 14"
                  value={form.estimated_days}
                  onChange={(e) => setForm({ ...form, estimated_days: e.target.value })}
                  required
                />
                <span className="input-suffix">days</span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-submit-proposal" disabled={proposalsClosed} title={proposalsClosed ? proposalBlockReason : ''}>
              {proposalsClosed ? 'Proposals Closed' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProposalForm;
