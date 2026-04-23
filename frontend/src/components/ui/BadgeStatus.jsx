import React from 'react';
import './ui.css';

const colorMap = {
  pending: { bg: 'rgba(249,212,35,0.15)', text: '#F9D423' },
  active: { bg: 'rgba(26,213,152,0.15)', text: '#1AD598' },
  in_progress: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  completed: { bg: 'rgba(26,213,152,0.15)', text: '#1AD598' },
  accepted: { bg: 'rgba(26,213,152,0.15)', text: '#1AD598' },
  rejected: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  cancelled: { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' },
  open: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  closed: { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' },
};

const BadgeStatus = ({ status }) => {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const colors = colorMap[key] || { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' };

  return (
    <span
      className="ui-badge-status"
      style={{ background: colors.bg, color: colors.text }}
    >
      {status}
    </span>
  );
};

export default BadgeStatus;
