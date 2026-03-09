import React, { useState } from "react";
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

  const handleRegister = async () => {
    if (!name || !email || !password || !role || !confirmPassword) {
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
        navigate("/");
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
    <div className="auth-page-body">
      <div className="auth-container-glow">
        <div className="auth-card">
          <div className="auth-logo">TalentLink</div>
          <h2 className="auth-title">Register</h2>

          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <div className="auth-form-group">
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="username@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Confirm Password</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>

            <div className="auth-form-group" style={{ marginBottom: "25px" }}>
              <label className="auth-label">Role</label>
              <select className="auth-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select Role</option>
                <option value="Client">Client</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>

            <button type="submit" className="btn-auth-submit">Create Account</button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
