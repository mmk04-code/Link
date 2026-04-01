import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/CreateProject.css';

function CreateProject() {
  const [form, setForm] = useState({
    title: '', description: '', skills_required: '',
    bid_type: 'flexible', budget_min: '', budget_max: '', budget_fixed: '', duration_days: '',
    deadline_type: 'flexible', submission_deadline: '', max_proposals: 20,
  });
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    let resolvedBudgetMin = form.budget_min;
    let resolvedBudgetMax = form.budget_max;

    if (form.bid_type === 'fixed') {
      const fixed = Number(form.budget_fixed);
      if (Number.isNaN(fixed) || fixed <= 0) {
        setSubmitError('Please enter a valid fixed budget amount.');
        return;
      }
      resolvedBudgetMin = String(fixed);
      resolvedBudgetMax = String(fixed);
    } else {
      const min = Number(form.budget_min);
      const max = Number(form.budget_max);
      if (Number.isNaN(min) || Number.isNaN(max) || min <= 0 || max <= 0) {
        setSubmitError('Please enter valid minimum and maximum budget values.');
        return;
      }
      if (min > max) {
        setSubmitError('Maximum budget must be greater than or equal to minimum budget.');
        return;
      }
    }

    if (form.deadline_type === 'fixed' && !form.submission_deadline) {
      setSubmitError('Please select a submission deadline for fixed deadline type.');
      return;
    }

    let resolvedDurationDays = form.duration_days;
    if (form.deadline_type === 'fixed') {
      const selectedDate = new Date(form.submission_deadline);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      resolvedDurationDays = String(Math.max(diffDays, 1));
    } else {
      const days = Number(form.duration_days);
      if (Number.isNaN(days) || days <= 0) {
        setSubmitError('Please enter a valid duration in days.');
        return;
      }
    }

    try {
      const token = localStorage.getItem('access');
      const payload = {
        title: form.title,
        description: form.description,
        skills_required: form.skills_required,
        bid_type: form.bid_type,
        budget_min: resolvedBudgetMin,
        budget_max: resolvedBudgetMax,
        duration_days: resolvedDurationDays,
        deadline_type: form.deadline_type,
        submission_deadline: form.deadline_type === 'fixed' ? form.submission_deadline : null,
        max_proposals: form.max_proposals,
      };

      await axios.post('http://127.0.0.1:8000/api/projects/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Project created!');
      navigate('/my-projects');
    } catch (error) {
      const data = error?.response?.data;
      const message =
        data?.submission_deadline?.[0] ||
        data?.budget_max?.[0] ||
        data?.budget_min?.[0] ||
        data?.bid_type?.[0] ||
        data?.max_proposals?.[0] ||
        data?.detail ||
        data?.error ||
        (typeof data === 'string' ? data : '') ||
        'Failed to create project';
      setSubmitError(message);
    }
  };

  return (
    <div className="cp-page-wrapper">
      <div className="cp-page-header">
        <h2>Post a New Project</h2>
        <p>Fill out the details below to connect with top freelancers</p>
      </div>

      <div className="cp-progress-row">
        <div className="cp-step active">
          <div className="cp-step-circle">1</div>
          <span>Details</span>
        </div>
        <div className="cp-connector"></div>
        <div className="cp-step upcoming">
          <div className="cp-step-circle">2</div>
          <span>Review</span>
        </div>
      </div>

      <div className="cp-form-card">
        <form onSubmit={handleSubmit}>
          
          <div className="cp-section-title">1. Project Details</div>
          
          <div className="cp-field-group">
            <label className="cp-label">Project Title</label>
            <input
              className="cp-input"
              name="title"
              placeholder="e.g. Build a React E-commerce Site"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="cp-field-group">
            <label className="cp-label">Description</label>
            <textarea
              className="cp-textarea"
              name="description"
              placeholder="Describe the project requirements in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="cp-section-title">2. Skills & Expertise</div>

          <div className="cp-field-group">
            <label className="cp-label">Skills Required</label>
            <div className="cp-skills-mock">
              {form.skills_required && form.skills_required.split(',').map((skill, index) => {
                if(!skill.trim()) return null;
                return (
                  <span key={index} className="cp-skill-tag">
                    {skill.trim()} <span className="close-x">×</span>
                  </span>
                )
              })}
            </div>
            <input
              className="cp-input"
              name="skills_required"
              placeholder="e.g. React, Node.js, MongoDB (comma separated)"
              value={form.skills_required}
              onChange={(e) => setForm({ ...form, skills_required: e.target.value })}
              required
            />
          </div>

          <div className="cp-section-title">3. Budget & Timeline</div>

          <div className="cp-field-group">
            <label className="cp-label">Bid Type</label>
            <select
              className="cp-input"
              value={form.bid_type}
              onChange={(e) => setForm({ ...form, bid_type: e.target.value })}
            >
              <option value="flexible">Flexible Range</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <div className="cp-hint">
              Flexible: freelancers bid within your range. Fixed: freelancers must bid your exact amount.
            </div>
          </div>

          {form.bid_type === 'flexible' ? (
            <div className="cp-field-group">
              <label className="cp-label">Budget Range</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="cp-input-icon-wrap">
                  <span className="cp-icon">₹</span>
                  <input
                    className="cp-input has-icon"
                    type="number"
                    name="budget_min"
                    placeholder="Min budget"
                    value={form.budget_min}
                    onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                    required
                  />
                </div>
                <div className="cp-input-icon-wrap">
                  <span className="cp-icon">₹</span>
                  <input
                    className="cp-input has-icon"
                    type="number"
                    name="budget_max"
                    placeholder="Max budget"
                    value={form.budget_max}
                    onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="cp-field-group">
              <label className="cp-label">Budget</label>
              <div className="cp-input-icon-wrap">
                <span className="cp-icon">₹</span>
                <input
                  className="cp-input has-icon"
                  type="number"
                  name="budget_fixed"
                  placeholder="Enter fixed budget"
                  value={form.budget_fixed}
                  onChange={(e) => setForm({ ...form, budget_fixed: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div className="cp-field-group">
            <label className="cp-label">Proposal Deadline Type</label>
            <select
              className="cp-input"
              value={form.deadline_type}
              onChange={(e) => setForm({ ...form, deadline_type: e.target.value })}
            >
              <option value="flexible">Flexible</option>
              <option value="fixed">Fixed (Submit within date)</option>
            </select>
          </div>

          {form.deadline_type === 'fixed' && (
            <div className="cp-field-group">
              <label className="cp-label">Submission Deadline</label>
              <input
                className="cp-input"
                type="date"
                name="submission_deadline"
                value={form.submission_deadline}
                onChange={(e) => setForm({ ...form, submission_deadline: e.target.value })}
                required
              />
              <div className="cp-hint">Freelancers can submit proposals only until this date.</div>
            </div>
          )}

          {form.deadline_type === 'flexible' && (
            <div className="cp-field-group">
              <label className="cp-label">Duration</label>
              <div className="cp-input-suffix-wrap">
                <input
                  className="cp-input"
                  type="number"
                  name="duration_days"
                  placeholder="e.g. 30"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  required
                />
                <span className="cp-input-suffix">days</span>
              </div>
              <div className="cp-hint">Estimated time to complete in days.</div>
            </div>
          )}

          <div className="cp-field-group">
            <label className="cp-label">Proposal Limit</label>
            <input
              className="cp-input"
              type="number"
              min="1"
              name="max_proposals"
              placeholder="e.g. 20"
              value={form.max_proposals}
              onChange={(e) => setForm({ ...form, max_proposals: e.target.value })}
              required
            />
            <div className="cp-hint">After reaching this limit, new freelancers cannot submit proposals.</div>
          </div>

          {submitError && (
            <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '-4px' }}>{submitError}</div>
          )}

          <div className="cp-bottom-actions">
            <button type="button" className="btn-cp-back" onClick={() => navigate('/projects')}>
              Cancel
            </button>
            <button type="submit" className="btn-cp-next">
              Post Project
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateProject;
