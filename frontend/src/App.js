import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

/* ---------------- LOGIN COMPONENT ---------------- */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        email: email,
        password: password,
      });

      console.log("Login response:", response.data);
      
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      // Fetch user details to get role
      const userResponse = await axios.get("http://127.0.0.1:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });

      console.log("User data:", userResponse.data);
      
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
    // Backend responded with error
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      alert("Invalid email or password. Please try again.");
    } 
    else if (status === 400) {
      if (data.detail) {
        alert("" + data.detail);
      } else {
        alert("Please check your email and password format.");
      }
    } 
    else if (status === 403) {
      alert("Your account doesn't have access. Please contact support.");
    } 
    else if (status === 500) {
      alert("Server error. Please try again later.");
    } 
    else {
      alert("Login failed. Please try again.");
    }
  } 
  else if (error.request) {
    // Request made but no response
    alert("Cannot connect to server. Please check:\n• Backend is running\n• Internet connection");
  } 
  else {
    // Something else happened
    alert("An unexpected error occurred. Please try again.");
  }
}
  };

  return (
    <div className="container">
      <h2>TalentLink Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p style={{ marginTop: "15px" }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

/* ---------------- REGISTER COMPONENT ---------------- */
function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    <div className="container">
      <h2>Register for TalentLink</h2>

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="">Select Role</option>
        <option value="Client">Client</option>
        <option value="Freelancer">Freelancer</option>
      </select>

      <button onClick={handleRegister}>Register</button>

      <p style={{ marginTop: "15px" }}>
        Already have an account? <Link to="/">Login here</Link>
      </p>
    </div>
  );
}

/* ---------------- CLIENT DASHBOARD ---------------- */
function ClientDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="container">
      <h2>Client Dashboard</h2>
      <p>Welcome, Client!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

/* ---------------- FREELANCER DASHBOARD ---------------- */
function FreelancerDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="container">
      <h2>Freelancer Dashboard</h2>
      <p>Welcome, Freelancer!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

/* ---------------- MAIN APP COMPONENT ---------------- */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;