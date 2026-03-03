import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ProjectFeed.css';

function ProjectFeed() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/');
        return;
      }
      // Get user role
      const userRes = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserRole(userRes.data.role);

      const response = await axios.get('http://127.0.0.1:8000/api/projects/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let fetchedProjects = response.data;
      if (userRes.data.role === 'CLIENT') {
        fetchedProjects = fetchedProjects.filter(p => p.client_name === userRes.data.username || p.client === userRes.data.id);
      }

      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading projects...</div>;

  return (
    <div className="project-feed-container">
      <div className="feed-header">
        <h2 className="feed-title">{userRole === 'CLIENT' ? 'My Projects' : 'Available Projects'}</h2>
        <button
          onClick={() => navigate(userRole === 'CLIENT' ? '/client-dashboard' : '/freelancer-dashboard')}
          style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="feed-grid">
        {projects.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", marginTop: "20px" }}>
            No projects available at the moment.
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="feed-card">
              <div className="feed-card-content">
                <h3 className="feed-card-title">{project.title}</h3>
                <p className="feed-card-desc">
                  {project.description.length > 200
                    ? project.description.substring(0, 200) + '...'
                    : project.description}
                </p>

                <div className="feed-card-meta">
                  <span className="feed-meta-item">
                    <span>💰</span> ₹{parseFloat(project.budget_min).toFixed(0)} - ₹{parseFloat(project.budget_max).toFixed(0)}
                  </span>
                  <span className="feed-meta-item">
                    <span>⏱️</span> {project.duration_days} days
                  </span>
                  <span className="feed-meta-item">
                    <span>🛠️</span> {project.skills_required}
                  </span>
                  <span className="feed-meta-item">
                    <span>👤</span> {project.client_name}
                  </span>
                </div>
              </div>

              <div className="feed-card-actions">
                <button
                  className="btn-view-project"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectFeed;
