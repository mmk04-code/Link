import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";
import "./App.css";

/* ---------------- LOGIN COMPONENT ---------------- */

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!email || !password || !role) {
      alert("Please fill all fields");
      return;
    }

    localStorage.setItem("token", "dummy-jwt-token");
    localStorage.setItem("role", role);

    if (role === "Client") {
      navigate("/client-dashboard");
    } else {
      navigate("/freelancer-dashboard");
    }
  };

  return (
    <div className="container">
      <h2>TalentLink Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <select onChange={(e) => setRole(e.target.value)}>
        <option value="">-- Select Role --</option>
        <option value="Client">Client</option>
        <option value="Freelancer">Freelancer</option>
      </select>

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
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!name || !email || !password || !role) {
      alert("Please fill all fields");
      return;
    }

    // Simulate successful registration
    alert("Registration successful! Please login.");
    navigate("/");
  };

  return (
    <div className="container">
      <h2>TalentLink Register</h2>

      <input
        type="text"
        placeholder="Full Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <select onChange={(e) => setRole(e.target.value)}>
        <option value="">-- Select Role --</option>
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

/* ---------------- DASHBOARDS ---------------- */

function ClientDashboard() {
  const navigate = useNavigate();

   useEffect(() => {
    if (!localStorage.getItem("token")) {
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

function FreelancerDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="container">
      <h2>Freelancer Dashboard</h2>
      <p>Welcome, Freelancer!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

/* ---------------- APP ROUTES ---------------- */

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
