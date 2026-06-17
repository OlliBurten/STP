/**
 * NotificationContext — en sanningskälla för notiser (lista + olästa-räknare).
 * Driver både badgen på Profil-fliken (BottomNav) och notis-flödet i Profil-sidan,
 * så att markera-läst uppdaterar badgen direkt. Ersätter klockan i gamla MobileHeader.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";

const NotificationContext = createContext({
  list: [], unreadCount: 0, refresh: () => {}, markRead: () => {}, markAllRead: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ list: [], unreadCount: 0 });

  const refresh = useCallback(() => {
    if (!user) { setState({ list: [], unreadCount: 0 }); return; }
    fetchNotifications()
      .then((data) => setState({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const markRead = useCallback((id) => {
    markNotificationRead(id).catch(() => {});
    setState((prev) => ({
      list: prev.list.map((x) => (x.id === id ? { ...x, readAt: x.readAt || new Date().toISOString() } : x)),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }, []);

  const markAllRead = useCallback(() => {
    markAllNotificationsRead().catch(() => {});
    setState((prev) => ({
      list: prev.list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      unreadCount: 0,
    }));
  }, []);

  return (
    <NotificationContext.Provider value={{ ...state, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
