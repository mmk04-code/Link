import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form submission default reload
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        email: email,
        password: password,
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      // Fetch user details to get role
      const userResponse = await axios.get("http://127.0.0.1:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });

      localStorage.setItem("userId", userResponse.data.id);
      localStorage.setItem("role", userResponse.data.role || "");
      localStorage.setItem("username", userResponse.data.username || "");
      localStorage.setItem("first_name", userResponse.data.first_name || "");
      window.dispatchEvent(new Event('auth-changed'));

      // Redirect based on role
      if (userResponse.data.role === "CLIENT") {
        navigate("/client-dashboard");
      } else if (userResponse.data.role === "FREELANCER") {
        navigate("/freelancer-dashboard");
      } else {
        navigate("/client-dashboard"); // fallback
      }

    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          setErrorMessage("Invalid email or password. Please try again.");
        } else if (status === 400) {
          if (data.detail) {
            setErrorMessage("" + data.detail);
          } else {
            setErrorMessage("Please check your email and password format.");
          }
        } else if (status === 403) {
          setErrorMessage("Your account does not have access. Please contact support.");
        } else if (status === 500) {
          setErrorMessage("Server error. Please try again later.");
        } else {
          setErrorMessage("Login failed. Please try again.");
        }
      } else if (error.request) {
        setErrorMessage("Cannot connect to server. Please check that the backend is running.");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
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
            <h2>Sign in to your account</h2>
            <p>Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="auth-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {errorMessage && <div className="auth-error-block" role="alert">{errorMessage}</div>}

            <div className="forgot-password">
              <Link to="#">Forgot Password?</Link>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="auth-switch-link">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
          
          <div className="admin-login-link">
            <Link to="/admin/login">Admin Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
