import React from 'react';
import { Inbox } from 'lucide-react';
import './ui.css';

const EmptyState = ({ icon, title, message, actionLabel, onAction }) => (
  <div className="ui-empty-state">
    <div className="empty-icon">{icon || <Inbox size={30} strokeWidth={2} />}</div>
    <h3 className="empty-title">{title || 'Nothing here yet'}</h3>
    {message && <p className="empty-message">{message}</p>}
    {actionLabel && onAction && (
      <button className="empty-action" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
