import { useCallback, useEffect, useState } from "react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";

/** Notiser för inloggad användare — delas av toppmenyn och åkeriportalens sidomeny. */
export function useNotifications(user, panelOpen) {
  const [notifs, setNotifs] = useState({ list: [], unreadCount: 0 });

  const load = useCallback(() => {
    fetchNotifications()
      .then((data) => setNotifs({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, []);

  // Hämta vid inloggning och när panelen öppnas/stängs.
  useEffect(() => {
    if (user) load();
  }, [user, panelOpen, load]);

  const markRead = useCallback((item) => {
    if (item.readAt) return;
    markNotificationRead(item.id).catch(() => {});
    setNotifs((prev) => ({
      list: prev.list.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }, []);

  const markAll = useCallback(() => {
    markAllNotificationsRead()
      .then(() => setNotifs((prev) => ({
        unreadCount: 0,
        list: prev.list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      })))
      .catch(() => {});
  }, []);

  return { notifs, markRead, markAll };
}
