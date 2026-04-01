import React from 'react';
import './ui.css';

const StatCard = ({ icon, label, value, trend, onClick }) => (
  <div className="ui-stat-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
    <div className="stat-card-header">
      <span className="stat-card-icon">{icon}</span>
      <span className="stat-card-label">{label}</span>
    </div>
    <div className="stat-card-value">{value}</div>
    {trend !== undefined && (
      <div className={`stat-card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

export default StatCard;
