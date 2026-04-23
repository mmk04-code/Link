import React from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import axios from 'axios';
import '../styles/AppLayout.css';

/* Map exact pathname → human-readable page title */
const pageTitles = {
  '/client-dashboard': 'Client Dashboard',
  '/freelancer-dashboard': 'Freelancer Dashboard',
  '/projects': 'Projects',
  '/projects/create': 'Post a Project',
  '/proposals': 'Proposals',
  '/freelancer/proposals': 'My Proposals',
  '/my-proposals': 'My Proposals',
  '/contracts': 'Contracts',
  '/messages': 'Messages',
  '/profile': 'Profile',
};

/* Dynamic route title patterns — checked in order */
const dynamicTitles = [
  { pattern: '/proposals/create/:projectId', title: 'Submit Proposal' },
  { pattern: '/contracts/new/:proposalId', title: 'Create Contract Draft' },
  { pattern: '/projects/:id', title: 'Project Details' },
  { pattern: '/contracts/:id', title: 'Contract Details' },
  { pattern: '/contracts/:id/review', title: 'Contract Review' },
];

const AppLayout = () => {
  const location = useLocation();
  const [verification, setVerification] = React.useState({ is_verified: true, has_pending_request: false, request: null });
  const [requestingVerification, setRequestingVerification] = React.useState(false);

  /* Check exact static routes first */
  let title = pageTitles[location.pathname];

  /* Then check dynamic path patterns */
  if (!title) {
    for (const { pattern, title: t } of dynamicTitles) {
      if (matchPath(pattern, location.pathname)) {
        title = t;
        break;
      }
    }
  }

  /* Finally fall back to capitalised last slug segment */
  if (!title) {
    const lastSegment = location.pathname.split('/').filter(Boolean).pop() || '';
    /* Don't show numeric IDs as titles */
    if (/^\d+$/.test(lastSegment)) {
      title = 'Dashboard';
    } else {
      title = lastSegment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  const isFullBleed = location.pathname.startsWith('/messages') || location.pathname.startsWith('/admin/messages');

  React.useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token) return;
        const res = await axios.get('http://127.0.0.1:8000/api/users/verification/status/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVerification(res.data || { is_verified: true, has_pending_request: false, request: null });
      } catch (_) {
        // Fail open so UI is not blocked.
      }
    };
    run();
  }, [location.pathname]);

  const requestVerification = async () => {
    try {
      setRequestingVerification(true);
      const token = localStorage.getItem('access');
      if (!token) return;
      const res = await axios.post('http://127.0.0.1:8000/api/users/verification/request/', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.data?.request) {
        setVerification({ is_verified: false, has_pending_request: true, request: res.data.request });
      }
    } catch (_) {
      // Ignore noisy UI errors.
    } finally {
      setRequestingVerification(false);
    }
  };

  const pendingMinutes = verification?.request?.remaining_seconds
    ? Math.max(1, Math.ceil(Number(verification.request.remaining_seconds) / 60))
    : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar title={title} />
        {!verification.is_verified && (
          <div className="verification-banner">
            <div>
              <strong>Account verification required:</strong> You can browse, but posting projects/proposals is blocked until admin verifies your account.
            </div>
            <button
              type="button"
              className="verification-btn"
              disabled={requestingVerification || verification.has_pending_request}
              onClick={requestVerification}
            >
              {verification.has_pending_request ? 'Verification Requested (pending)' : (requestingVerification ? 'Requesting...' : 'Request Verification')}
            </button>
            {verification.has_pending_request && pendingMinutes && (
              <span className="verification-timer">expires in about {pendingMinutes} min</span>
            )}
          </div>
        )}
        <div className={`app-content ${isFullBleed ? 'no-padding' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
