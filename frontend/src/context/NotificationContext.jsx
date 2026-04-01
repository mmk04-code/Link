import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const NotificationContext = createContext(null);

const getAuthToken = () => {
  const activeRole = (localStorage.getItem('role') || localStorage.getItem('adminRole') || '').toUpperCase();
  if (activeRole === 'ADMIN') {
    return localStorage.getItem('adminAccess') || localStorage.getItem('access');
  }
  return localStorage.getItem('access') || localStorage.getItem('adminAccess');
};

const getNotificationLink = (notification) => (
  notification?.link || notification?.data?.link || ''
);

const getNotificationSubtype = (notification) => (
  (notification?.data?.notification_subtype || '').toLowerCase()
);

const isMessageNotification = (notification) => {
  const type = (notification?.type || '').toLowerCase();
  const subtype = getNotificationSubtype(notification);
  return type === 'message' && subtype !== 'proposal';
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await axios.get('http://127.0.0.1:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page_size: 50 },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Notification fetch failed', error);
      if (error?.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    const handleAuthStateChange = () => refresh();

    window.addEventListener('storage', handleAuthStateChange);
    window.addEventListener('focus', handleAuthStateChange);
    window.addEventListener('auth-changed', handleAuthStateChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleAuthStateChange);
      window.removeEventListener('focus', handleAuthStateChange);
      window.removeEventListener('auth-changed', handleAuthStateChange);
    };
  }, [refresh]);

  const markRead = useCallback(async (id) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await axios.patch(`http://127.0.0.1:8000/api/notifications/${id}/read/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refresh();
    } catch (error) {
      console.error('Notification markRead failed', error);
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await axios.patch('http://127.0.0.1:8000/api/notifications/read_all/', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refresh();
    } catch (error) {
      console.error('Notification markAllRead failed', error);
    }
  }, [refresh]);

  const markManyRead = useCallback(async (ids = []) => {
    const token = getAuthToken();
    if (!token || !ids.length) return;

    try {
      await Promise.all(ids.map((id) => (
        axios.patch(`http://127.0.0.1:8000/api/notifications/${id}/read/`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
      )));
      await refresh();
    } catch (error) {
      console.error('Notification markManyRead failed', error);
    }
  }, [refresh]);

  const syncReadByRoute = useCallback(async (pathname) => {
    if (!pathname) return;

    const unread = notifications.filter((n) => !n.is_read);
    if (!unread.length) return;

    const normalized = pathname.toLowerCase();
    let matches = [];

    if (normalized.startsWith('/messages')) {
      matches = unread.filter((n) => isMessageNotification(n));
    } else {
      matches = unread.filter((n) => {
        const link = getNotificationLink(n).toLowerCase();
        if (!link) return false;
        return normalized === link || normalized.startsWith(link);
      });
    }

    if (!matches.length) return;
    await markManyRead(matches.map((n) => n.id));
  }, [notifications, markManyRead]);

  const unreadMessageCount = useMemo(
    () => notifications.filter((n) => !n.is_read && isMessageNotification(n)).length,
    [notifications],
  );

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    unreadMessageCount,
    refresh,
    markRead,
    markAllRead,
    markManyRead,
    syncReadByRoute,
    isMessageNotification,
    getNotificationSubtype,
  }), [
    notifications,
    unreadCount,
    unreadMessageCount,
    refresh,
    markRead,
    markAllRead,
    markManyRead,
    syncReadByRoute,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
