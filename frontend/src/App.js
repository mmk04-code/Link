import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";
import "./App.css";

/* ---------------- LOGIN COMPONENT ---------------- */

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password || !role) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("role", data.role);

        if (data.role === "Client") {
          navigate("/client-dashboard");
        } else {
          navigate("/freelancer-dashboard");
        }
      } else {
        alert("Invalid login credentials");
      }
    } catch (error) {
      alert("Backend not reachable");
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

  const handleRegister = async () => {
    if (!name || !email || !password || !role) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          role: role,
        }),
      });

      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/");
      } else {
        alert("Registration failed");
      }
    } catch (error) {
      alert("Backend not reachable");
    }
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
