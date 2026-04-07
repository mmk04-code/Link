import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChartNoAxesColumn,
  FileText,
  Users,
  FileSignature,
  ShieldCheck,
  ShieldAlert,
  Star,
  MessagesSquare,
  User,
  Search,
  X,
} from 'lucide-react';
import '../styles/AdminLayout.css';
import api from '../api';

const ADMIN_SEEN_ALERT_COUNTS_KEY = 'adminSeenAlertCounts';

function getStoredSeenAlertCounts() {
  try {
    const raw = localStorage.getItem(ADMIN_SEEN_ALERT_COUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const normalized = {};
    Object.keys(parsed).forEach((key) => {
      const value = Number(parsed[key]);
      if (Number.isFinite(value) && value >= 0) {
        normalized[key] = value;
      }
    });
    return normalized;
  } catch (_) {
    return {};
  }
}

function persistSeenAlertCounts(counts) {
  try {
    localStorage.setItem(ADMIN_SEEN_ALERT_COUNTS_KEY, JSON.stringify(counts));
  } catch (_) {
    // Ignore localStorage write failures.
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function typeIcon(type) {
  if (!type) return 'N';
  if (type.includes('proposal') || type === 'message') return type === 'message' ? 'M' : 'P';
  if (type.includes('contract')) return 'C';
  if (type.includes('message')) return 'M';
  return 'N';
}

function typeCls(notif) {
  const t = notif?.data?.notification_subtype || notif?.type || '';
  if (t.includes('proposal')) return 'icon-proposal';
  if (t.includes('contract')) return 'icon-contract';
  if (t.includes('message')) return 'icon-message';
  return 'icon-default';
}

const AdminLayout = ({ children, onSearch, showSearch = true, searchDebounceMs = 280 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  const [adminAlerts, setAdminAlerts] = useState([]);
  const [seenAlertCounts, setSeenAlertCounts] = useState(() => getStoredSeenAlertCounts());
  const bellRef = useRef(null);
  const unreadCount = adminAlerts.filter((item) => {
    const seenCount = Number(seenAlertCounts[item.id] || 0);
    return Number(item.alertCount || 0) > seenCount;
  }).length;

  const menuItems = useMemo(
    () => [
      { path: '/admin/dashboard', icon: ChartNoAxesColumn, label: 'Dashboard' },
      { path: '/admin/proposals', icon: FileText, label: 'Proposals' },
      { path: '/admin/users', icon: Users, label: 'Users' },
      { path: '/admin/contracts', icon: FileSignature, label: 'Contracts' },
      { path: '/admin/verifications', icon: ShieldCheck, label: 'Verifications' },
      { path: '/admin/support', icon: ShieldAlert, label: 'Support' },
      { path: '/admin/reviews', icon: Star, label: 'Reviews' },
      { path: '/admin/messages', icon: MessagesSquare, label: 'Messages' },
    ],
    []
  );

  useEffect(() => {
    const token = localStorage.getItem('adminAccess');
    const role = localStorage.getItem('adminRole');

    if (!token || role !== 'ADMIN') {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchChange = (event) => {
    setQuery(event.target.value);
  };

  useEffect(() => {
    if (!showSearch || !onSearch) return;

    // Keep search responsive while avoiding API/filter churn on every keypress.
    if (!query) {
      onSearch('');
      return;
    }

    const timer = setTimeout(() => {
      onSearch(query);
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, showSearch, searchDebounceMs]);

  const handleLogout = () => {
    localStorage.removeItem('adminAccess');
    localStorage.removeItem('adminRefresh');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('role');
    localStorage.removeItem(ADMIN_SEEN_ALERT_COUNTS_KEY);
    localStorage.removeItem('adminReadAlertIds');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/admin/login');
  };

  useEffect(() => {
    persistSeenAlertCounts(seenAlertCounts);
  }, [seenAlertCounts]);

  const refresh = async () => {
    try {
      const token = localStorage.getItem('adminAccess');
      if (!token) return;

      const response = await api.get('/admin/dashboard/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data || {};
      const alerts = [];
      const nowIso = new Date().toISOString();
      const verificationPending = Number(data?.verifications?.pending || 0);
      const supportPending = Number(data?.support?.pending || 0);
      const supportPendingOnly = Number(data?.support?.pending_only || 0);
      const supportUnderReview = Number(data?.support?.under_review || 0);
      const reportsPending = Number(data?.reports?.pending || 0);

      if (verificationPending > 0) {
        alerts.push({
          id: 'verification-pending',
          type: 'verification',
          alertCount: verificationPending,
          message: `${verificationPending} verification request${verificationPending > 1 ? 's' : ''} pending review`,
          created_at: nowIso,
          link: '/admin/verifications',
        });
      }

      if (supportPending > 0) {
        let supportMessage = `${supportPending} support ticket${supportPending > 1 ? 's' : ''} pending or under review`;
        let supportLink = '/admin/support?status=all';

        if (supportPendingOnly > 0 && supportUnderReview === 0) {
          supportMessage = `${supportPendingOnly} support ticket${supportPendingOnly > 1 ? 's' : ''} pending`;
          supportLink = '/admin/support?status=pending';
        } else if (supportUnderReview > 0 && supportPendingOnly === 0) {
          supportMessage = `${supportUnderReview} support ticket${supportUnderReview > 1 ? 's' : ''} under review`;
          supportLink = '/admin/support?status=under_review';
        }

        alerts.push({
          id: 'support-pending',
          type: 'support',
          alertCount: supportPending,
          message: supportMessage,
          created_at: nowIso,
          link: supportLink,
        });
      }

      if (reportsPending > 0) {
        alerts.push({
          id: 'reports-pending',
          type: 'proposal_report',
          alertCount: reportsPending,
          message: `${reportsPending} report${reportsPending > 1 ? 's' : ''} pending admin action`,
          created_at: nowIso,
          link: '/admin/support?status=all',
        });
      }

      setAdminAlerts(alerts);
    } catch (_) {
      setAdminAlerts([]);
    }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, []);

  const markAllRead = () => {
    setSeenAlertCounts((prev) => {
      const next = { ...prev };
      adminAlerts.forEach((item) => {
        next[item.id] = Math.max(Number(next[item.id] || 0), Number(item.alertCount || 0));
      });
      persistSeenAlertCounts(next);
      return next;
    });
  };

  const markRead = (notif) => {
    if (!notif?.id) return;
    setSeenAlertCounts((prev) => {
      const next = {
        ...prev,
        [notif.id]: Math.max(Number(prev[notif.id] || 0), Number(notif.alertCount || 0)),
      };
      persistSeenAlertCounts(next);
      return next;
    });
  };

  const markOneRead = async (notif) => {
    const targetLink = notif.link || notif?.data?.link;
    try {
      markRead(notif);
      if (targetLink) navigate(targetLink);
    } catch (_) {
      if (targetLink) navigate(targetLink);
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <button type="button" className="admin-brand-btn" onClick={() => navigate('/admin/dashboard')}>
            Link Admin
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon"><Icon size={15} strokeWidth={2} /></span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="admin-main">
        <div className="top-bar">
          {showSearch ? (
            <div className="search-container">
              <Search className="search-icon" size={14} strokeWidth={2} />
              <input
                type="text"
                placeholder="Search users, contracts, proposals..."
                className={`search-input ${query ? 'has-value' : ''}`}
                value={query}
                onChange={handleSearchChange}
              />
              {query && (
                <span className="search-clear" onClick={() => handleSearchChange({ target: { value: '' }})}>
                  <X size={14} strokeWidth={2} />
                </span>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="admin-profile">
            <div className="topbar-bell-wrapper" ref={bellRef}>
              <button
                type="button"
                className="topbar-bell"
                title="Notifications"
                onClick={() => setBellOpen((prev) => !prev)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>

              {bellOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span className="notif-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button type="button" className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                    )}
                  </div>
                  <div className="notif-list">
                      {adminAlerts.length === 0 ? (
                      <div className="notif-empty">No notifications yet</div>
                    ) : (
                        adminAlerts.map((notif) => {
                          const isRead = Number(seenAlertCounts[notif.id] || 0) >= Number(notif.alertCount || 0);
                          return (
                        <div
                          key={notif.id}
                            className={`notif-item ${!isRead ? 'notif-unread' : ''}`}
                          onClick={() => markOneRead(notif)}
                        >
                          <span className={`notif-icon ${typeCls(notif)}`}>{typeIcon(notif.type)}</span>
                          <div className="notif-body">
                              <p className={`notif-msg ${!isRead ? 'notif-msg-unread' : ''}`}>{notif.message}</p>
                            <span className="notif-time">{timeAgo(notif.created_at)}</span>
                          </div>
                            {!isRead && <span className="notif-dot" />}
                        </div>
                        );
                        })
                    )}
                  </div>
                  <div className="notif-header" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button type="button" className="notif-mark-all" onClick={refresh}>Refresh</button>
                  </div>
                </div>
              )}
            </div>
            <div className="admin-identity" aria-label="Admin profile">
              <span className="admin-avatar" role="img" aria-hidden="true">
                <User size={14} strokeWidth={2} />
              </span>
              <span className="admin-name">Admin</span>
            </div>
            <button type="button" className="admin-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="content-area">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
