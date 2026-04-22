import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import axios from 'axios';
import { User, LogOut } from 'lucide-react';

const toAbsoluteMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `http://127.0.0.1:8000${url}`;
  return url;
};

/* ── Helper: human-readable relative time ── */
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

/* ── Type icon letter ── */
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

const Topbar = ({ title }) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [fullName, setFullName] = useState(localStorage.getItem('full_name') || localStorage.getItem('username') || 'User');
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('profile_image') || '');
  const [avatarBroken, setAvatarBroken] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();
  const profileRef = useRef(null);
  const bellRef = useRef(null);

  const username = (localStorage.getItem('username') || '').trim() || 'User';
  const displayName = fullName || username;
  const initials = displayName
    .split(' ')
    .map((n) => (n || '').trim())
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const syncProfile = (e) => {
      const normalized = toAbsoluteMediaUrl(localStorage.getItem('profile_image') || '');
      setAvatarBroken(false);
      setAvatarUrl(normalized);
      if (normalized !== (localStorage.getItem('profile_image') || '')) {
        localStorage.setItem('profile_image', normalized);
      }
      if (e?.type === 'profile-updated' && e?.detail?.full_name) {
        setFullName(e.detail.full_name);
      } else {
        setFullName(localStorage.getItem('full_name') || localStorage.getItem('username') || 'User');
      }
    };
    window.addEventListener('profile-updated', syncProfile);
    window.addEventListener('profile-image-updated', syncProfile);
    window.addEventListener('auth-changed', syncProfile);
    window.addEventListener('storage', syncProfile);
    syncProfile();
    return () => {
      window.removeEventListener('profile-updated', syncProfile);
      window.removeEventListener('profile-image-updated', syncProfile);
      window.removeEventListener('auth-changed', syncProfile);
      window.removeEventListener('storage', syncProfile);
    };
  }, []);

  useEffect(() => {
    const fetchProfileImage = async () => {
      const token = localStorage.getItem('access');
      if (!token) return;
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/users/profile/', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        const newName = res.data?.full_name || '';
        if (newName) {
          localStorage.setItem('full_name', newName);
          setFullName(newName);
        }
        const avatar = toAbsoluteMediaUrl((res.data?.profile_image || res.data?.profile_image_url || '').trim());
        localStorage.setItem('profile_image', avatar);
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: { full_name: newName } }));
        setAvatarBroken(false);
        setAvatarUrl(avatar);
      } catch (_) {
        // Keep initials fallback if profile fetch fails.
      }
    };

    fetchProfileImage();
  }, []);

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
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

  return (
    <header className="app-topbar">
      <h1 className="topbar-title">{title || 'Dashboard'}</h1>

      <div className="topbar-actions">
        {/* ── Notification Bell ── */}
        <div className="topbar-bell-wrapper" ref={bellRef}>
          <button
            className="topbar-bell"
            title="Notifications"
            onClick={() => { setBellOpen(prev => !prev); setProfileOpen(false); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {bellOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`notif-item ${!notif.is_read ? 'notif-unread' : ''}`}
                      onClick={() => markOneRead(notif)}
                    >
                      <span className={`notif-icon ${typeCls(notif)}`}>
                        {typeIcon(notif.type)}
                      </span>
                      <div className="notif-body">
                        <p className={`notif-msg ${!notif.is_read ? 'notif-msg-unread' : ''}`}>
                          {notif.message}
                        </p>
                        <span className="notif-time">{timeAgo(notif.created_at)}</span>
                      </div>
                      {!notif.is_read && <span className="notif-dot" />}
                    </div>
                  ))
                )}
              </div>
              <div className="notif-header" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button className="notif-mark-all" onClick={refresh}>Refresh</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Avatar Dropdown ── */}
        <div className="topbar-avatar-wrapper" ref={profileRef}>
          <button
            className="topbar-avatar"
            onClick={() => { setProfileOpen(prev => !prev); setBellOpen(false); }}
          >
            {avatarUrl && !avatarBroken ? (
              <img
                key={avatarUrl}
                className="topbar-avatar-img"
                src={avatarUrl}
                alt="Profile"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              initials
            )}
          </button>

          {profileOpen && (
            <div className="topbar-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-username">{displayName}</span>
              </div>
              <button
                className="dropdown-item"
                onClick={() => { setProfileOpen(false); navigate('/profile'); }}
              >
                <User size={14} strokeWidth={2} style={{ marginRight: '8px' }} />
                Profile
              </button>
              <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                <LogOut size={14} strokeWidth={2} style={{ marginRight: '8px' }} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
