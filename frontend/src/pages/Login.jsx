import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form submission default reload

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
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
          alert("Invalid email or password. Please try again.");
        } else if (status === 400) {
          if (data.detail) {
            alert("" + data.detail);
          } else {
            alert("Please check your email and password format.");
          }
        } else if (status === 403) {
          alert("Your account doesn't have access. Please contact support.");
        } else if (status === 500) {
          alert("Server error. Please try again later.");
        } else {
          alert("Login failed. Please try again.");
        }
      } else if (error.request) {
        alert("Cannot connect to server. Please check:\n• Backend is running\n• Internet connection");
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="auth-page-body">
      <div className="auth-container-glow">
        <div className="auth-card">
          <div className="auth-logo">TalentLink</div>
          <h2 className="auth-title">Login</h2>

          <form onSubmit={handleLogin}>
            <div className="auth-form-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="username@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-form-group" style={{ marginBottom: "5px" }}>
              <label className="auth-label">Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="forgot-password-link">
              <Link to="#">Forgot Password?</Link>
            </div>

            <button type="submit" className="btn-auth-submit">Sign in</button>
          </form>

          <div className="auth-footer">
            Don't have an account yet? <Link to="/register">Register for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
