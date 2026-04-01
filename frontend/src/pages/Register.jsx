import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("register-page-active");
    return () => {
      document.body.classList.remove("register-page-active");
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !role) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/users/register/", {
        username: email.split('@')[0],
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        role: role === "Client" ? "CLIENT" : "FREELANCER",
      });

      console.log("Register response:", response.data);

      if (response.status === 201 || response.status === 200) {
        alert("Registration successful! Please login.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Register error:", error);
      if (error.response) {
        alert("Registration failed: " + JSON.stringify(error.response.data));
      } else {
        alert("Backend not reachable");
      }
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left Brand Panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand-logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h1 className="brand-name">TalentLink</h1>
          <p className="brand-tagline">Where Talent Meets Opportunity</p>
          
          <div className="brand-features">
            <div className="feature-row">
              <span className="feature-dot dot-brand"></span>
              <span className="feature-text">Connect with top clients and skilled freelancers</span>
            </div>
            <div className="feature-row">
              <span className="feature-dot dot-green"></span>
              <span className="feature-text">Secure payments and seamless contract management</span>
            </div>
            <div className="feature-row">
              <span className="feature-dot dot-amber"></span>
              <span className="feature-text">24/7 dedicated support and dispute resolution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="form-header">
            <h2>Create your account</h2>
            <p>Join TalentLink and unlock new opportunities.</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="auth-group">
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="auth-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-group">
              <label className="auth-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="auth-group">
              <label className="auth-label">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="auth-group">
              <label className="auth-label">Role</label>
              <div className="role-selector">
                <div 
                  className={`role-card ${role === "Client" ? "active" : ""}`}
                  onClick={() => setRole("Client")}
                >
                  I'm a Client
                </div>
                <div 
                  className={`role-card ${role === "Freelancer" ? "active" : ""}`}
                  onClick={() => setRole("Freelancer")}
                >
                  I'm a Freelancer
                </div>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>
          </form>

          <div className="auth-switch-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
