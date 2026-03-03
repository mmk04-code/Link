import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import Profile from './pages/Profile';
import ProjectFeed from './pages/projects/ProjectFeed';
import ProjectDetails from './pages/projects/ProjectDetails';
import CreateProject from './pages/projects/CreateProject';
import ProposalForm from './pages/proposals/ProposalForm';
import ProposalsList from './pages/proposals/ProposalsList';
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Routes */}
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />

        {/* Profile Route */}
        <Route path="/profile" element={<Profile />} />

        {/* Project Routes */}
        <Route path="/projects" element={<ProjectFeed />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/projects/create" element={<CreateProject />} />

        {/* Proposal Routes */}
        <Route path="/proposals" element={<ProposalsList />} />
        <Route path="/proposals/create/:projectId" element={<ProposalForm />} />
      </Routes>
    </Router>
  );
}

export default App;