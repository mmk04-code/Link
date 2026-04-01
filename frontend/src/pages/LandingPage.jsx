import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Header */}
      <nav className="landing-nav">
        <div className="logo">TalentLink</div>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <h1>Where Talent Meets Opportunity</h1>
        <p className="hero-subtitle">Connect with top talent and exciting opportunities in one place</p>
        <Link to="/register" className="btn-primary">Get Started</Link>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="feature-card">
          <h3>For Clients</h3>
          <p>Post projects, find skilled freelancers, and manage contracts seamlessly</p>
        </div>
        <div className="feature-card">
          <h3>For Freelancers</h3>
          <p>Discover work opportunities, submit proposals, and grow your career</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">1. Post a Project</div>
          <div className="step">2. Receive Proposals</div>
          <div className="step">3. Select & Contract</div>
          <div className="step">4. Complete & Review</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 TalentLink - Connecting Freelancers & Clients Worldwide</p>
      </footer>
    </div>
  );
};

export default LandingPage;
