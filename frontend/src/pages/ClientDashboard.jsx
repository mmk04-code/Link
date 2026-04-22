import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FolderKanban, MailOpen, CircleCheckBig, MessagesSquare, CirclePlus, FileText, FileSignature, Inbox } from 'lucide-react';
import { useNotifications } from "../context/NotificationContext";
import Sidebar from "../components/Sidebar";
import "../styles/ClientDashboard.css";

const toAbsoluteMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `http://127.0.0.1:8000${url}`;
  return url;
};

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

function getMaxRangeForUnit(unit) {
  if (unit === 'month') return 24;
  if (unit === 'year') return 5;
  return 52;
}

function normalizeRangeCount(value, unit, fallback = 12) {
  const parsed = Number.parseInt(value, 10);
  const max = getMaxRangeForUnit(unit);
  if (Number.isNaN(parsed)) return Math.min(max, Math.max(1, fallback));
  return Math.min(max, Math.max(1, parsed));
}

function getRangeTitle(unit) {
  if (unit === 'month') return 'Monthly Activity Analysis';
  if (unit === 'year') return 'Yearly Activity Analysis';
  return 'Weekly Activity Analysis';
}

function getXAxisTitle(unit, count) {
  if (unit === 'year') return 'Important Months';
  if (unit === 'month') return 'Months';
  if (count === 1) return 'Important Days';
  return 'Weeks';
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const year = Number.parseInt(dateOnlyMatch[1], 10);
      const month = Number.parseInt(dateOnlyMatch[2], 10) - 1;
      const day = Number.parseInt(dateOnlyMatch[3], 10);
      const localDate = new Date(year, month, day, 0, 0, 0, 0);
      return Number.isNaN(localDate.getTime()) ? null : localDate;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildRecentTimeBuckets(unit = 'week', count = 12) {
  const now = new Date();
  const buckets = [];

  if (unit === 'year') {
    const totalMonths = count * 12;
    for (let i = totalMonths - 1; i >= 0; i -= 1) {
      const base = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = base.getMonth();
      const year = base.getFullYear();
      const quarterStart = monthIndex === 0 || monthIndex === 3 || monthIndex === 6 || monthIndex === 9;
      const label = monthIndex === 0
        ? base.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : base.toLocaleDateString('en-US', { month: 'short' });

      buckets.push({
        label,
        start: new Date(year, monthIndex, 1, 0, 0, 0, 0),
        end: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
        important: quarterStart || i === 0,
      });
    }
    return buckets;
  }

  if (unit === 'week' && count === 1) {
    const weekdayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayOfWeek = day.getDay();
      const shortDay = weekdayMap[dayOfWeek];
      const important = shortDay === 'Mon' || shortDay === 'Wed' || shortDay === 'Fri' || i === 0;

      buckets.push({
        label: day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0),
        end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999),
        important,
      });
    }
    return buckets;
  }

  for (let i = count - 1; i >= 0; i -= 1) {
    let start;
    let end;
    let label;
    let important = false;

    if (unit === 'month') {
      const base = new Date(now.getFullYear(), now.getMonth() - i, 1);
      start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
      label = base.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      important = base.getMonth() % 3 === 0 || i === 0;
    } else if (unit === 'year') {
      const year = now.getFullYear() - i;
      start = new Date(year, 0, 1, 0, 0, 0, 0);
      end = new Date(year, 11, 31, 23, 59, 59, 999);
      label = String(year);
    } else {
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() - i * 7);
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      label = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      important = i % 4 === 0 || i === 0;
    }

    buckets.push({
      label,
      start,
      end,
      important,
    });
  }
  return buckets;
}

function extractItemDate(item, preferredFields = []) {
  const fallbackFields = ['created_at', 'updated_at', 'submitted_at', 'date_created'];
  const candidates = [...preferredFields, ...fallbackFields];
  for (const field of candidates) {
    if (!(field in (item || {}))) continue;
    const parsed = parseDateValue(item[field]);
    if (parsed) return parsed;
  }
  return null;
}

function countItemsInBuckets(items, buckets, predicate = () => true, dateFields = []) {
  return buckets.map((bucket) => (
    items.filter((item) => {
      if (!predicate(item)) return false;
      const when = extractItemDate(item, dateFields);
      if (!when) return false;
      return when >= bucket.start && when <= bucket.end;
    }).length
  ));
}

function buildYAxisTicks(maxValue, tickCount = 4, pad = 40, height = 280) {
  const safeMax = Math.max(1, Number(maxValue) || 1);
  const step = Math.max(1, Math.ceil(safeMax / tickCount));
  const axisMax = step * tickCount;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, idx) => {
    const ratio = idx / tickCount;
    return {
      value: axisMax - idx * step,
      y: pad + ratio * (height - pad * 2),
    };
  });

  return { axisMax, yTicks };
}

function buildLinePath(values, width, height, pad, maxValue) {
  if (!values.length) return '';
  const drawW = width - pad * 2;
  const drawH = height - pad * 2;
  if (values.length === 1) {
    const x = pad + drawW / 2;
    const y = pad + drawH - ((values[0] || 0) / Math.max(1, maxValue)) * drawH;
    return `M ${(x - 0.01).toFixed(2)} ${y.toFixed(2)} L ${(x + 0.01).toFixed(2)} ${y.toFixed(2)}`;
  }
  return values.map((v, idx) => {
    const x = pad + (idx * drawW) / (values.length - 1);
    const y = pad + drawH - ((v || 0) / Math.max(1, maxValue)) * drawH;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function buildPointPositions(values, width, height, pad, maxValue) {
  if (!values.length) return [];
  const drawW = width - pad * 2;
  const drawH = height - pad * 2;
  return values.map((value, idx) => {
    const x = pad + (values.length === 1 ? drawW / 2 : (idx * drawW) / (values.length - 1));
    const y = pad + drawH - ((value || 0) / Math.max(1, maxValue)) * drawH;
    return { x, y, value };
  });
}

function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profile_image') || '');
  const [profileImageBroken, setProfileImageBroken] = useState(false);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [trendUnit, setTrendUnit] = useState('week');
  const [trendCount, setTrendCount] = useState(12);
  const [trendCountDraft, setTrendCountDraft] = useState('12');
  const [loading, setLoading] = useState(true);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const { notifications, unreadCount, unreadMessageCount, markRead, markAllRead, refresh } = useNotifications();

  const fetchDashboardData = useCallback(async (token) => {
    try {
      const userRes = await axios.get("http://127.0.0.1:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);

      const profileRes = await axios.get("http://127.0.0.1:8000/api/users/profile/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const avatar = toAbsoluteMediaUrl(profileRes.data?.profile_image || profileRes.data?.profile_image_url || '');
      setProfileImage(avatar);
      localStorage.setItem('profile_image', avatar);

      const projRes = await axios.get("http://127.0.0.1:8000/api/projects/my/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(Array.isArray(projRes.data) ? projRes.data : []);

      const propRes = await axios.get("http://127.0.0.1:8000/api/proposals/received/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProposals(Array.isArray(propRes.data) ? propRes.data : []);

      const contractsRes = await axios.get("http://127.0.0.1:8000/api/contracts/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contractList = Array.isArray(contractsRes.data)
        ? contractsRes.data
        : contractsRes.data?.results || [];
      setContracts(contractList);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }
    fetchDashboardData(token);
  }, [navigate, fetchDashboardData]);

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const syncAvatar = () => setProfileImage(toAbsoluteMediaUrl(localStorage.getItem('profile_image') || ''));
    window.addEventListener('profile-image-updated', syncAvatar);
    syncAvatar();
    return () => window.removeEventListener('profile-image-updated', syncAvatar);
  }, []);

  useEffect(() => {
    setProfileImageBroken(false);
  }, [profileImage]);

  const commitTrendCount = useCallback((unitOverride) => {
    const unit = unitOverride || trendUnit;
    const normalized = normalizeRangeCount(trendCountDraft, unit, trendCount);
    setTrendCount(normalized);
    setTrendCountDraft(String(normalized));
  }, [trendCountDraft, trendCount, trendUnit]);

  const handleTrendUnitChange = (nextUnit) => {
    setTrendUnit(nextUnit);
    const normalized = normalizeRangeCount(trendCountDraft, nextUnit, trendCount);
    setTrendCount(normalized);
    setTrendCountDraft(String(normalized));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('auth-changed'));
    navigate("/");
  };

  const markOneRead = async (notif) => {
    const targetLink = notif.link || notif?.data?.link;
    try {
      await markRead(notif.id);
      if (targetLink) navigate(targetLink);
    } catch (_) {
      if (targetLink) navigate(targetLink);
    }
  };

  if (loading) {
    return (
      <div className="cd-loading">
        <div className="cd-spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  // Calculate stats
  const inProgressProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'active').length;
  const completedProjects = contracts.filter(c => (c.status || '').toLowerCase() === 'completed').length;
  const newProposals = proposals.filter(p => p.status === 'pending').length;
  const totalProjects = projects.length;
  const trendBuckets = buildRecentTimeBuckets(trendUnit, trendCount);
  const trendLabels = trendBuckets.map((b) => b.label);
  const xAxisTitle = getXAxisTitle(trendUnit, trendCount);
  const projectsTrend = countItemsInBuckets(projects, trendBuckets, () => true, ['created_at']);
  const proposalsTrend = countItemsInBuckets(proposals, trendBuckets, () => true, ['created_at']);
  const contractsTrend = countItemsInBuckets(contracts, trendBuckets, (c) => (c.status || '').toLowerCase() === 'completed', ['end_date', 'updated_at', 'created_at']);
  const trendMax = Math.max(1, ...projectsTrend, ...proposalsTrend, ...contractsTrend);
  const chartW = 780;
  const chartH = 280;
  const chartPad = 40;
  const yTickCount = 4;
  const { axisMax, yTicks } = buildYAxisTicks(trendMax, yTickCount, chartPad, chartH);
  const projectsPath = buildLinePath(projectsTrend, chartW, chartH, chartPad, axisMax);
  const proposalsPath = buildLinePath(proposalsTrend, chartW, chartH, chartPad, axisMax);
  const contractsPath = buildLinePath(contractsTrend, chartW, chartH, chartPad, axisMax);
  const projectsPoints = buildPointPositions(projectsTrend, chartW, chartH, chartPad, axisMax);
  const proposalsPoints = buildPointPositions(proposalsTrend, chartW, chartH, chartPad, axisMax);
  const contractsPoints = buildPointPositions(contractsTrend, chartW, chartH, chartPad, axisMax);
  const labelStep = Math.max(1, Math.ceil(trendLabels.length / 9));

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const rawUsername = (user?.username || localStorage.getItem('username') || localStorage.getItem('name') || 'there').trim();
  const firstName = (user?.first_name || localStorage.getItem('first_name') || '').trim();
  const displayName = firstName || (rawUsername ? rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1) : 'there');
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const colorCycle = [
    { bg: 'var(--brand-dim)', color: 'var(--brand)' },
    { bg: 'var(--blue-dim)', color: 'var(--blue)' },
    { bg: 'var(--amber-dim)', color: 'var(--amber)' },
    { bg: 'var(--green-dim)', color: 'var(--green)' },
  ];

  return (
    <div className="cd-container">
      {/* Top Navbar */}
      <nav className="cd-navbar">
        <div className="cd-brand-menu-wrap">
          <button
            type="button"
            className="cd-navbar-brand cd-brand-button"
            onClick={() => setBrandMenuOpen((prev) => !prev)}
            title="Open navigation menu"
          >
            <div className="cd-brand-icon">T</div>
            <span className="cd-brand-name">Link</span>
          </button>
        </div>
        <div className="cd-navbar-right">
          <div className="topbar-bell-wrapper" ref={bellRef}>
            <button
              type="button"
              className="cd-bell-btn"
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
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notif-item ${!notif.is_read ? 'notif-unread' : ''}`}
                        onClick={() => markOneRead(notif)}
                      >
                        <span className={`notif-icon ${typeCls(notif)}`}>{typeIcon(notif.type)}</span>
                        <div className="notif-body">
                          <p className={`notif-msg ${!notif.is_read ? 'notif-msg-unread' : ''}`}>{notif.message}</p>
                          <span className="notif-time">{timeAgo(notif.created_at)}</span>
                        </div>
                        {!notif.is_read && <span className="notif-dot" />}
                      </div>
                    ))
                  )}
                </div>
                <div className="notif-header" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button type="button" className="notif-mark-all" onClick={refresh}>Refresh</button>
                </div>
              </div>
            )}
          </div>
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/profile')}
            title="Go to Profile"
          >
            <div className="cd-nav-avatar">
              {profileImage && !profileImageBroken ? (
                <img
                  className="cd-nav-avatar-img"
                  src={profileImage}
                  alt="Profile"
                  onError={() => setProfileImageBroken(true)}
                />
              ) : (
                (user?.username || 'U')[0].toUpperCase()
              )}
            </div>
          </div>
          <button className="cd-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {brandMenuOpen && (
        <div className="cd-nav-overlay" onClick={() => setBrandMenuOpen(false)}>
          <aside className="cd-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <Sidebar embedded onNavigate={() => setBrandMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="cd-main">
        {/* Page Header */}
        <div className="cd-page-header">
          <h1 className="cd-greeting">{greeting}, {displayName}!</h1>
          <p className="cd-date">
            {currentDate}
            {newProposals > 0 && (
              <> · <span className="cd-highlight">{newProposals} proposal{newProposals > 1 ? 's' : ''} need{newProposals === 1 ? 's' : ''} attention</span></>
            )}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="cd-kpi-grid">
          <div className="cd-kpi-card" onClick={() => navigate("/projects")} style={{ cursor: 'pointer' }}>
            <div className="cd-kpi-top">
              <div className="cd-kpi-icon" style={{ background: 'var(--brand-dim)' }}>
                <FolderKanban size={17} strokeWidth={2} style={{ color: 'var(--brand)' }} />
              </div>
            </div>
            <div className="cd-kpi-value">{inProgressProjects}</div>
            <div className="cd-kpi-label">IN PROGRESS</div>
            <div className="cd-kpi-sub">{inProgressProjects === 0 ? 'No active projects' : `${inProgressProjects} active currently`}</div>
          </div>

          <div className="cd-kpi-card" onClick={() => navigate("/proposals")} style={{ cursor: 'pointer' }}>
            <div className="cd-kpi-top">
              <div className="cd-kpi-icon" style={{ background: 'var(--blue-dim)' }}>
                <MailOpen size={17} strokeWidth={2} style={{ color: 'var(--blue)' }} />
              </div>
              {newProposals > 0 && <span className="cd-kpi-badge amber">New</span>}
            </div>
            <div className="cd-kpi-value">{newProposals}</div>
            <div className="cd-kpi-label">NEW PROPOSALS</div>
            <div className="cd-kpi-sub">{newProposals === 0 ? 'All caught up' : 'Requires your attention'}</div>
          </div>

          <div className="cd-kpi-card" onClick={() => navigate("/my-projects")} style={{ cursor: 'pointer' }}>
            <div className="cd-kpi-top">
              <div className="cd-kpi-icon" style={{ background: 'var(--green-dim)' }}>
                <CircleCheckBig size={17} strokeWidth={2} style={{ color: 'var(--green)' }} />
              </div>
            </div>
            <div className="cd-kpi-value">{completedProjects}</div>
            <div className="cd-kpi-label">COMPLETED PROJECTS</div>
            <div className="cd-kpi-sub">{totalProjects} total projects created</div>
          </div>

          <div className="cd-kpi-card" onClick={() => navigate("/messages?open=unread&source=kpi")} style={{ cursor: 'pointer' }}>
            <div className="cd-kpi-top">
              <div className="cd-kpi-icon" style={{ background: 'var(--red-dim)' }}>
                <MessagesSquare size={17} strokeWidth={2} style={{ color: 'var(--red)' }} />
              </div>
            </div>
            <div className="cd-kpi-value">{unreadMessageCount}</div>
            <div className="cd-kpi-label">MESSAGES</div>
            <div className="cd-kpi-sub">{unreadMessageCount > 0 ? `${unreadMessageCount} unread messages` : 'No unread messages'}</div>
          </div>
        </div>

        <div className="cd-panel cd-analytics-panel">
          <div className="cd-panel-header">
            <span className="cd-panel-title">{getRangeTitle(trendUnit)}</span>
            <div className="cd-analytics-controls">
              <select
                className="cd-analytics-select"
                value={trendUnit}
                onChange={(e) => handleTrendUnitChange(e.target.value)}
                aria-label="Select trend period"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              <input
                className="cd-analytics-input"
                type="number"
                min={1}
                max={getMaxRangeForUnit(trendUnit)}
                value={trendCountDraft}
                onChange={(e) => setTrendCountDraft(e.target.value)}
                onBlur={() => commitTrendCount()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTrendCount();
                  }
                }}
                aria-label="Enter trend range count"
              />
            </div>
          </div>
          <div className="cd-chart-wrap">
            <svg className="cd-chart" viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Client trend chart for projects, proposals, and completed contracts">
              {yTicks.map((tick) => (
                <line
                  key={`grid-${tick.y}`}
                  x1={chartPad}
                  y1={tick.y}
                  x2={chartW - chartPad}
                  y2={tick.y}
                  className="cd-chart-grid"
                />
              ))}

              <line x1={chartPad} y1={chartH - chartPad} x2={chartW - chartPad} y2={chartH - chartPad} className="cd-chart-axis" />
              <line x1={chartPad} y1={chartPad} x2={chartPad} y2={chartH - chartPad} className="cd-chart-axis" />

              {yTicks.map((tick) => (
                <text
                  key={`tick-${tick.y}`}
                  x={chartPad - 8}
                  y={tick.y + 4}
                  className="cd-chart-tick"
                  textAnchor="end"
                >
                  {tick.value}
                </text>
              ))}

              <path d={contractsPath} className="cd-chart-line cd-chart-contracts" />
              <path d={proposalsPath} className="cd-chart-line cd-chart-proposals" />
              <path d={projectsPath} className="cd-chart-line cd-chart-projects" />

              {contractsPoints.map((point, idx) => (
                <circle
                  key={`contract-point-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  className="cd-chart-point cd-chart-contracts"
                />
              ))}
              {proposalsPoints.map((point, idx) => (
                <circle
                  key={`proposal-point-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  className="cd-chart-point cd-chart-proposals"
                />
              ))}
              {projectsPoints.map((point, idx) => (
                <circle
                  key={`project-point-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  className="cd-chart-point cd-chart-projects"
                />
              ))}

              {trendBuckets.map((bucket, idx) => {
                const shouldRender = bucket.important || idx % labelStep === 0 || idx === trendBuckets.length - 1;
                if (!shouldRender) return null;
                const x = chartPad + (trendBuckets.length === 1 ? (chartW - chartPad * 2) / 2 : (idx * (chartW - chartPad * 2)) / (trendBuckets.length - 1));
                return (
                  <text key={`${bucket.label}-${idx}`} x={x} y={chartH - chartPad + 18} className="cd-chart-label" textAnchor="middle">{bucket.label}</text>
                );
              })}

              <text x={chartW / 2} y={chartH - 6} className="cd-chart-axis-title" textAnchor="middle">{xAxisTitle}</text>
              <text x={14} y={chartH / 2} className="cd-chart-axis-title" textAnchor="middle" transform={`rotate(-90 14 ${chartH / 2})`}>
                Activity Count
              </text>
            </svg>
            <div className="cd-chart-legend">
              <span><i className="cd-dot cd-dot-projects" /> Projects Posted</span>
              <span><i className="cd-dot cd-dot-proposals" /> Proposals Received</span>
              <span><i className="cd-dot cd-dot-contracts" /> Contracts Completed</span>
            </div>
          </div>
        </div>

        {/* Two column: Projects + Quick Actions */}
        <div className="cd-two-col">
          {/* My Projects Panel */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title">My Projects</span>
              <button className="cd-panel-link" onClick={() => navigate("/projects")}>View all →</button>
            </div>
            <div className="cd-panel-body">
              {projects.length === 0 ? (
                <div className="cd-empty-state">
                  <Inbox className="cd-empty-icon" size={32} strokeWidth={2} />
                  <p className="cd-empty-text">No projects yet</p>
                  <button className="cd-empty-btn" onClick={() => navigate("/projects/create")}>Post your first project</button>
                </div>
              ) : (
                projects.slice(0, 5).map((project, idx) => {
                  const c = colorCycle[idx % colorCycle.length];
                  return (
                    <div key={project.id} className="cd-project-row" onClick={() => navigate(`/projects/${project.id}`)}>
                      <div className="cd-project-initial" style={{ background: c.bg, color: c.color }}>
                        {project.title[0].toUpperCase()}
                      </div>
                      <div className="cd-project-info">
                        <span className="cd-project-name">{project.title}</span>
                        <span className="cd-project-meta">
                          ₹{project.budget_min}–₹{project.budget_max} · {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="cd-project-right">
                        <span className="cd-project-budget">₹{project.budget_max}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title">Quick Actions</span>
            </div>
            <div className="cd-actions-grid">
              <div className="cd-action-card" onClick={() => navigate("/projects/create")}>
                <div className="cd-action-icon" style={{ background: 'var(--brand-dim)' }}>
                  <CirclePlus size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} />
                </div>
                <span className="cd-action-label">Post Project</span>
                <span className="cd-action-sub">Create a new listing</span>
              </div>
              <div className="cd-action-card" onClick={() => navigate("/proposals")}>
                <div className="cd-action-icon" style={{ background: 'var(--blue-dim)' }}>
                  <FileText size={16} strokeWidth={2} style={{ color: 'var(--blue)' }} />
                </div>
                <span className="cd-action-label">View Proposals</span>
                <span className="cd-action-sub">Review freelancer bids</span>
              </div>
              <div className="cd-action-card" onClick={() => navigate("/contracts")}>
                <div className="cd-action-icon" style={{ background: 'var(--green-dim)' }}>
                  <FileSignature size={16} strokeWidth={2} style={{ color: 'var(--green)' }} />
                </div>
                <span className="cd-action-label">Contracts</span>
                <span className="cd-action-sub">Manage agreements</span>
              </div>
              <div className="cd-action-card" onClick={() => navigate("/messages?open=unread&source=quick-action")}>
                <div className="cd-action-icon" style={{ background: 'var(--red-dim)' }}>
                  <MessagesSquare size={16} strokeWidth={2} style={{ color: 'var(--red)' }} />
                </div>
                <span className="cd-action-label">Messages</span>
                <span className="cd-action-sub">
                  {unreadMessageCount > 0 ? `${unreadMessageCount} unread` : 'No unread messages'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClientDashboard;