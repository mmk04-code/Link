import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from './pages/Home';
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
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProposals from './pages/AdminProposals';
import AdminUsers from './pages/AdminUsers';
import AdminContracts from './pages/AdminContracts';
import AdminReviews from './pages/AdminReviews';
import AdminMessages from './pages/AdminMessages';
import AdminVerifications from './pages/AdminVerifications';
import AdminSupport from './pages/AdminSupport';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import ContractsPage from './pages/ContractsPage';
import MessagesPage from './pages/MessagesPage';
import SupportPage from './pages/SupportPage';
import ContractDetailPage from './pages/ContractDetailPage';
import ReviewPage from './pages/ReviewPage';
import ContractCreateFromProposal from './pages/ContractCreateFromProposal';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import "./App.css";
import './styles/layout-system.css';

function ThemeClassController() {
  useEffect(() => {
    document.body.classList.add('app-reference-theme');

    return () => {
      document.body.classList.remove('app-reference-theme');
    };
  }, []);

  return null;
}

function NotificationRouteSync() {
  const location = useLocation();
  const { syncReadByRoute } = useNotifications();

  useEffect(() => {
    syncReadByRoute(location.pathname);
  }, [location.pathname, syncReadByRoute]);

  return null;
}

function App() {
  return (
    <Router>
      <ThemeClassController />
      <NotificationProvider>
      <NotificationRouteSync />
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/login" element={<MainLayout showNavbar={false} contained={false}><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout showNavbar={false} contained={false}><Register /></MainLayout>} />
        <Route path="/admin/login" element={<MainLayout showNavbar={false} contained={false}><AdminLogin /></MainLayout>} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/proposals" element={<AdminProposals />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/contracts" element={<AdminContracts />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/support" element={<AdminSupport />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />

        {/* Dashboard Routes */}
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />

        {/* Profile Route */}
        <Route path="/profile" element={<Profile />} />

        {/* Project + proposal pages inside app shell */}
        <Route element={<AppLayout />}>
          <Route path="/projects" element={<ProjectFeed />} />
          <Route path="/my-projects" element={<ProjectFeed />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/proposals" element={<ProposalsList />} />
          <Route path="/my-proposals" element={<ProposalsList />} />
          <Route path="/freelancer/proposals" element={<ProposalsList />} />
          <Route path="/proposals/create/:projectId" element={<ProposalForm />} />
        </Route>

        {/* ----- NEW: Layout-wrapped routes for Client/Freelancer ----- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Contracts */}
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contracts/new/:proposalId" element={<ContractCreateFromProposal />} />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            <Route path="/contracts/:id/review" element={<ReviewPage />} />

            {/* Messages */}
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Route>

        {/* ----- NEW: Admin messages ----- */}
          <Route path="/admin/messages" element={<AdminMessages />} />
      </Routes>
      </NotificationProvider>
    </Router>
  );
}

export default App;