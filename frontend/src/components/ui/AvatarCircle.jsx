import React from 'react';
import './ui.css';

const colors = ['#1AD598', '#7B61FF', '#F9D423', '#3B82F6', '#EF4444', '#F97316'];

const AvatarCircle = ({ src, name = '', size = 40 }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* Deterministic color from name */
  const colorIndex = name
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  if (src) {
    return (
      <img
        className="ui-avatar-circle"
        src={src}
        alt={name}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="ui-avatar-circle ui-avatar-initials"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: colors[colorIndex],
      }}
    >
      {initials || '?'}
    </div>
  );
};

export default AvatarCircle;
