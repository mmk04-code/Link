import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ClientDashboard.css";

function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }

    fetchDashboardData(token);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      // Fetch user profile
      const userRes = await axios.get("http://127.0.0.1:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);

      // Fetch projects
      const projRes = await axios.get("http://127.0.0.1:8000/api/projects/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allProjects = projRes.data;

      // Client's projects: filter where client_name matches user.username, 
      // or optionally update backend to filter. We'll filter on client_name.
      const myProjects = allProjects.filter(p => p.client_name === userRes.data.username || p.client === userRes.data.id);
      setProjects(myProjects);

      // Fetch proposals to the client's projects
      const propRes = await axios.get("http://127.0.0.1:8000/api/proposals/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProposals(propRes.data);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return <div className="loading-dashboard">Loading dashboard...</div>;
  }

  // Calculate stats
  const inProgressProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'active').length;
  const newProposals = proposals.filter(p => p.status === 'pending').length;
  const totalProjects = projects.length;

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="client-dashboard-container">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-logo">
          <span className="logo-icon">◆</span> TalentLink
        </div>
        <div className="navbar-user">
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/profile')}
            title="Go to Profile"
          >
            <span className="user-icon">👤</span>
            <span className="username-text" style={{ fontWeight: '600' }}>{user?.username}</span>
          </div>
          <button className="logout-btn-nav" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        <header className="welcome-header">
          <div className="welcome-text">
            <span>👋</span> Welcome back, {user?.username}!
          </div>
          <div className="welcome-date">
            {currentDate}
          </div>
        </header>

        {/* Stats Section */}
        <div className="stats-grid">
          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate("/projects")}
          >
            <div className="stat-header">
              <span className="stat-icon orange">📋</span> In Progress Projects
            </div>
            <div className="stat-number">{inProgressProjects}</div>
            <div className="stat-subtext">{inProgressProjects === 0 ? "No active projects" : `${inProgressProjects} active currently`}</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate("/proposals")}
          >
            <div className="stat-header">
              <span className="stat-icon purple">✉️</span> New Proposals
            </div>
            <div className="stat-number">{newProposals}</div>
            <div className="stat-subtext">Requires your attention</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate("/projects")}
          >
            <div className="stat-header">
              <span className="stat-icon green">✅</span> Total Projects
            </div>
            <div className="stat-number">{totalProjects}</div>
            <div className="stat-subtext">Lifetime created projects</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <button className="post-project-btn-lg" onClick={() => navigate("/projects/create")}>
            <span className="plus-icon">+</span> POST NEW PROJECT
          </button>
        </div>

        {/* My Projects List */}
        <section className="my-projects-section">
          <div className="section-heading">
            <div className="section-title">
              <span>📋</span> MY PROJECTS
            </div>
            <button className="view-all" onClick={() => navigate("/projects")} style={{ color: '#0d6efd', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              View All →
            </button>
          </div>

          <div className="project-list-wrapper">
            {projects.length === 0 ? (
              <p style={{ color: '#777', padding: '10px 0' }}>You haven't posted any projects yet.</p>
            ) : (
              projects.map(project => (
                <div key={project.id} className="project-list-card">
                  <div className="project-list-info">
                    <div className="project-list-title">
                      {project.title}
                    </div>
                    <div className="project-list-meta">
                      <span className="meta-item">
                        <span>📅</span> {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <span className="meta-item">
                        <span style={{ color: '#ff9800' }}>💰</span> ₹{project.budget_min} - ₹{project.budget_max}
                      </span>
                    </div>
                  </div>
                  <div className="project-list-actions">
                    <button className="btn-action btn-view" onClick={() => navigate(`/projects/${project.id}`)}>
                      👁️ View
                    </button>
                    <button className="btn-action btn-edit" onClick={() => navigate(`/projects/${project.id}`)}>
                      ✏️ Edit
                    </button>
                    <button className="btn-action btn-proposals" onClick={() => navigate(`/proposals?project=${project.id}`)}>
                      📄 Proposals
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default ClientDashboard;