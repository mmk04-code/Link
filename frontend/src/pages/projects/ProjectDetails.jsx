import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ProjectDetails.css';

function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProject();
    getUserRole();
  }, [id]);

  const getUserRole = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) return;
      const response = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  const fetchProject = async () => {
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
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  if (!project) return <div style={{ padding: "40px", textAlign: "center" }}>Project not found</div>;

  return (
    <div className="project-details-container">
      <div className="details-wrapper">
        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="details-card">
          <div className="details-header">
            <h2 className="details-title">{project.title}</h2>
            <div className="details-meta-bar">
              <span className="meta-info">
                <span>👤</span>Posted by: {project.client_name}
              </span>
              <span className="meta-info">
                <span>💰</span>₹{parseFloat(project.budget_min).toFixed(0)} - ₹{parseFloat(project.budget_max).toFixed(0)}
              </span>
              <span className="meta-info">
                <span>⏱️</span>{project.duration_days} days
              </span>
              <span className="meta-info">
                <span>📌</span>Status: <b style={{ textTransform: 'capitalize', marginLeft: '4px' }}>{project.status}</b>
              </span>
            </div>
          </div>

          <div className="details-body">
            <div className="section-label">Description</div>
            <div className="details-desc">{project.description}</div>

            <div className="section-label">Skills Required</div>
            <div className="skills-container">
              {project.skills_required.split(',').map((skill, index) => (
                <span key={index} className="skill-tag">{skill.trim()}</span>
              ))}
            </div>
          </div>

          {userRole === 'FREELANCER' && project.status === 'open' && (
            <div className="apply-section">
              <button
                className="btn-apply"
                onClick={() => navigate(`/proposals/create/${id}`)}
              >
                Submit a Proposal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
