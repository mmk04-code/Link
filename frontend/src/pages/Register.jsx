import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import FormWrapper from "../components/form/FormWrapper";
import "../styles/Login.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("register-page-active");
    return () => {
      document.body.classList.remove("register-page-active");
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Full name is required.";
    }
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    }
    if (!password) {
      nextErrors.password = "Password is required.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    }
    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!role) {
      nextErrors.role = "Select your role.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const normalizedEmail = email.trim().toLowerCase();
      const response = await axios.post("http://127.0.0.1:8000/api/auth/register/", {
        username: normalizedEmail,
        email: normalizedEmail,
        password: password,
        role: role === "Client" ? "CLIENT" : "FREELANCER",
      });

      console.log("Register response:", response.data);

      if (response.status === 201 || response.status === 200) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Register error:", error);
      if (error.response) {
        const data = error.response.data || {};
        const firstField = Object.keys(data)[0];
        const firstFieldValue = firstField ? data[firstField] : null;
        const firstMessage =
          Array.isArray(firstFieldValue) && firstFieldValue.length > 0
            ? firstFieldValue[0]
            : typeof firstFieldValue === "string"
              ? firstFieldValue
              : data.detail || null;

        setErrorMessage(firstMessage || "Registration failed. Please check your details and try again.");
      } else {
        setErrorMessage("Cannot connect to backend. Please try again.");
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
        <Card className="auth-form-card">
          <div className="form-header">
            <h2>Create your account</h2>
            <p>Join TalentLink and unlock new opportunities.</p>
          </div>

          <FormWrapper onSubmit={handleRegister}>
            <Input
              id="register-name"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
            />

            <Input
              id="register-email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={fieldErrors.email}
            />

            <Input
              id="register-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              error={fieldErrors.password}
              endAdornment={
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              }
            />

            <Input
              id="register-confirm-password"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
              endAdornment={
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              }
            />

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
              {fieldErrors.role ? <p className="tl-ui-input-error">{fieldErrors.role}</p> : null}
            </div>

            {errorMessage && <div className="auth-error-block" role="alert">{errorMessage}</div>}

            <Button
              type="submit"
              variant="primary"
              className="auth-submit-btn"
              loading={isSubmitting}
              disabled={!name.trim() || !email.trim() || !password || !confirmPassword || !role}
            >
              Create Account
            </Button>
          </FormWrapper>

          <div className="auth-switch-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Register;
