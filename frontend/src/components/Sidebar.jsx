import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ChartNoAxesColumn,
  Users,
  FileText,
  FileSignature,
  Star,
  MessagesSquare,
  CirclePlus,
  FolderKanban,
  ShieldAlert,
  User,
  Search,
} from 'lucide-react';

const toAbsoluteMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `http://127.0.0.1:8000${url}`;
  return url;
};

const navConfig = {
  ADMIN: {
    sections: [
      {
        label: 'OVERVIEW',
        items: [
          { path: '/admin/dashboard', icon: ChartNoAxesColumn, label: 'Dashboard' },
        ],
      },
      {
        label: 'MANAGEMENT',
        items: [
          { path: '/admin/users', icon: Users, label: 'Users' },
          { path: '/admin/proposals', icon: FileText, label: 'Proposals' },
          { path: '/admin/contracts', icon: FileSignature, label: 'Contracts' },
          { path: '/admin/reviews', icon: Star, label: 'Reviews' },
          { path: '/admin/messages', icon: MessagesSquare, label: 'Messages' },
        ],
      },
    ],
  },
  CLIENT: {
    sections: [
      {
        label: 'OVERVIEW',
        items: [
          { path: '/client-dashboard', icon: ChartNoAxesColumn, label: 'Dashboard' },
        ],
      },
      {
        label: 'WORK',
        items: [
          { path: '/projects/create', icon: CirclePlus, label: 'Post Project' },
          { path: '/my-projects', icon: FolderKanban, label: 'My Projects' },
          { path: '/proposals', icon: FileText, label: 'Proposals' },
          { path: '/contracts', icon: FileSignature, label: 'Contracts' },
        ],
      },
      {
        label: 'OTHER',
        items: [
          { path: '/messages', icon: MessagesSquare, label: 'Messages' },
          { path: '/support', icon: ShieldAlert, label: 'Support' },
          { path: '/profile', icon: User, label: 'Profile' },
        ],
      },
    ],
  },
  FREELANCER: {
    sections: [
      {
        label: 'OVERVIEW',
        items: [
          { path: '/freelancer-dashboard', icon: ChartNoAxesColumn, label: 'Dashboard' },
        ],
      },
      {
        label: 'WORK',
        items: [
          { path: '/projects', icon: Search, label: 'Browse Projects' },
          { path: '/freelancer/proposals', icon: FileText, label: 'My Proposals' },
          { path: '/contracts', icon: FileSignature, label: 'Contracts' },
        ],
      },
      {
        label: 'OTHER',
        items: [
          { path: '/messages', icon: MessagesSquare, label: 'Messages' },
          { path: '/support', icon: ShieldAlert, label: 'Support' },
          { path: '/profile', icon: User, label: 'Profile' },
        ],
      },
    ],
  },
};

const Sidebar = ({ embedded = false, onNavigate }) => {
  const location = useLocation();
  const role = (localStorage.getItem('role') || '').toUpperCase();
  const username = localStorage.getItem('username') || 'User';
  const [fullName, setFullName] = useState(localStorage.getItem('full_name') || username);
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('profile_image') || '');
  const [avatarBroken, setAvatarBroken] = useState(false);

  const config = useMemo(() => navConfig[role] || navConfig.CLIENT, [role]);

  const initials = (fullName || username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
    window.addEventListener('storage', syncProfile);
    window.addEventListener('auth-changed', syncProfile);
    syncProfile();
    return () => {
      window.removeEventListener('profile-updated', syncProfile);
      window.removeEventListener('profile-image-updated', syncProfile);
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('auth-changed', syncProfile);
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

  return (
    <aside className={`app-sidebar${embedded ? ' app-sidebar-embedded' : ''}`}>
      {!embedded && (
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <span className="brand-icon-letter">T</span>
          </div>
          <span className="brand-text">TalentLink</span>
        </div>
      )}

      <nav className="sidebar-links">
        {config.sections.map((section) => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link${isActive ? ' active' : ''}`}
                  onClick={() => onNavigate && onNavigate(item.path)}
                >
                  <span className="sidebar-link-icon-box">
                    <Icon className="sidebar-link-icon" size={15} strokeWidth={2} />
                  </span>
                  <span className="sidebar-link-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-user-info">
        <div className="sidebar-user-avatar">
          {avatarUrl && !avatarBroken ? (
            <img
              key={avatarUrl}
              className="sidebar-user-avatar-img"
              src={avatarUrl}
              alt="Profile"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            initials
          )}
        </div>
        <div className="sidebar-user-details">
          <span className="sidebar-user-name">{fullName || username}</span>
          <span className="sidebar-user-role">{role || 'User'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
