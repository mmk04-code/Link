import React, { useState, useCallback, createContext, useContext } from 'react';
import './ui.css';

/* ---- Context ---- */
const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

/* ---- Single toast ---- */
const Toast = ({ id, message, type = 'info', onClose }) => {
  const typeClass = `toast-${type}`;
  return (
    <div className={`ui-toast ${typeClass}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => onClose(id)}>✕</button>
    </div>
  );
};

/* ---- Provider + container ---- */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="ui-toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default Toast;
