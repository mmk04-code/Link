import React, { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loggedInRole, setLoggedInRole] = useState("");

  const handleLogin = () => {
    if (!email || !password || !role) {
      alert("Please fill all fields");
      return;
    }

    // Simulating login success
    localStorage.setItem("token", "dummy-jwt-token");
    localStorage.setItem("role", role);

    setLoggedInRole(role);
  };

  const handleLogout = () => {
    localStorage.clear();
    setLoggedInRole("");
  };

  // If logged in → show dashboard
  if (loggedInRole === "Client") {
    return (
      <div className="container">
        <h2>Client Dashboard</h2>
        <p>Welcome, Client!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (loggedInRole === "Freelancer") {
    return (
      <div className="container">
        <h2>Freelancer Dashboard</h2>
        <p>Welcome, Freelancer!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // Default → Login Page
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

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="">-- Select Role --</option>
        <option value="Client">Client</option>
        <option value="Freelancer">Freelancer</option>
      </select>

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default App;
