import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/FreelancerDashboard.css";

function FreelancerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
      const userRes = await axios.get("http://127.0.0.1:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);

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
    return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#666" }}>Loading dashboard...</div>;
  }

  // Calculate stats
  const pendingProposals = proposals.filter(p => p.status === 'pending').length;
  const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
  const totalProposals = proposals.length;

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="freelancer-dashboard-container">
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
            onClick={() => navigate("/proposals")}
          >
            <div className="stat-header">
              <span className="stat-icon blue">⏳</span> Pending Proposals
            </div>
            <div className="stat-number">{pendingProposals}</div>
            <div className="stat-subtext">{pendingProposals === 0 ? "✨ No pending proposals" : "Awaiting client response"}</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate("/proposals")}
          >
            <div className="stat-header">
              <span className="stat-icon green">🎉</span> Accepted Proposals
            </div>
            <div className="stat-number">{acceptedProposals}</div>
            <div className="stat-subtext">{acceptedProposals === 0 ? "✨ No accepted jobs yet" : "Active jobs won"}</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate("/proposals")}
          >
            <div className="stat-header">
              <span className="stat-icon orange">📄</span> Total Proposals
            </div>
            <div className="stat-number">{totalProposals}</div>
            <div className="stat-subtext">Lifetime submitted bids</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <button className="btn-primary-lg" onClick={() => navigate("/projects")}>
            🔍 FIND PROJECTS
          </button>
          <button className="btn-secondary-lg" onClick={() => navigate("/proposals")}>
            📄 VIEW MY PROPOSALS
          </button>
        </div>
      </main>
    </div>
  );
}

export default FreelancerDashboard;
