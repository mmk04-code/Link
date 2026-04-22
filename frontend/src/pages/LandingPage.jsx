import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="brand-lockup" aria-label="Link home">
          <span className="brand-mark">L</span>
          <span className="logo">Link</span>
        </div>
        <div className="nav-links">
          <Link className="nav-login" to="/login">Sign in</Link>
          <Link className="nav-register" to="/register">Create account</Link>
        </div>
      </nav>

      <main className="hero-section">
        <h1>
          Welcome to <span className="hero-highlight">Link</span>
        </h1>
        <p className="hero-subtitle">
          Sign in or create an account to continue.
        </p>
        <div className="hero-buttons">
          <Link to="/login" className="btn-primary">Sign in</Link>
          <Link to="/register" className="btn-secondary">Create account</Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
