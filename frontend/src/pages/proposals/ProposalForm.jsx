import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ProposalForm.css';

function ProposalForm() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ cover_letter: '', bid_amount: '', estimated_days: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access');
      await axios.post('http://127.0.0.1:8000/api/proposals/create/', {
        project: projectId, ...form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Proposal submitted successfully!');
      navigate('/proposals');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit proposal. Make sure you are a freelancer and logged in.');
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
            <label className="form-label">Bid Amount</label>
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
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Duration (Days)</label>
            <input
              className="form-input"
              type="number"
              name="estimated_days"
              placeholder="e.g. 14"
              value={form.estimated_days}
              onChange={(e) => setForm({ ...form, estimated_days: e.target.value })}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-submit-proposal">Submit Proposal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProposalForm;
