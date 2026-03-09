import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/CreateProject.css';

function CreateProject() {
  const [form, setForm] = useState({
    title: '', description: '', skills_required: '',
    budget_min: '', budget_max: '', duration_days: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access');
      await axios.post('http://127.0.0.1:8000/api/projects/', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Project created!');
      navigate('/projects');
    } catch (error) {
      alert('Failed to create project');
    }
  };

  return (
    <div className="create-project-container">
      <div className="create-project-card">
        <div className="create-project-header">
          <h2 className="create-project-title">Create Project</h2>
          <p className="create-project-subtitle">Fill out the details below to post your project</p>
        </div>
        <form className="create-project-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input
              className="form-input"
              name="title"
              placeholder="e.g. Build a React E-commerce Site"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              name="description"
              placeholder="Describe the project requirements in detail..."
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skills Required</label>
            <input
              className="form-input"
              name="skills_required"
              placeholder="e.g. React, Node.js, MongoDB (comma separated)"
              onChange={(e) => setForm({ ...form, skills_required: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Budget</label>
              <div className="input-with-icon">
                <span className="input-icon">$</span>
                <input
                  className="form-input"
                  type="number"
                  name="budget_min"
                  placeholder="0"
                  onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Max Budget</label>
              <div className="input-with-icon">
                <span className="input-icon">$</span>
                <input
                  className="form-input"
                  type="number"
                  name="budget_max"
                  placeholder="1000"
                  onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Duration</label>
            <div className="input-with-icon">
              <input
                className="form-input"
                type="number"
                name="duration_days"
                placeholder="e.g. 30"
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                required
              />
            </div>
            <small style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Estimated time to complete in days.</small>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/projects')}>Cancel</button>
            <button type="submit" className="btn-submit">Post Project</button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateProject;
