import React from 'react';
import './ui.css';

const ConfirmModal = ({ isOpen, title, message, onCancel, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="ui-modal-overlay" onClick={onCancel}>
      <div className="ui-modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title || 'Are you sure?'}</h3>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          <button className="modal-btn modal-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="modal-btn modal-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
