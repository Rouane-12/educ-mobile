import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { notifApi } from "../api/endpoints";
import {
  initialNotificationData,
  onForegroundPush,
  onNotificationPress,
  onPushOpened,
  pollServer,
  registerPush,
  requestPermission,
  scheduleReminder,
  setupChannels,
  usesPush,
} from "../lib/notifications";
import { useApp } from "./AppContext";

const NotificationsContext = createContext(null);
const POLL_MS = 30000;

/** Compteur de non-lues, liste des notifications et ouverture de l'écran visé au toucher. */
export function NotificationsProvider({ children, onOpen }) {
  const { user, settings } = useApp();
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  const prefsRef = useRef(settings);
  prefsRef.current = settings;

  const refresh = useCallback(
    async (display = false) => {
      if (!user) return;
      try {
        const res = await pollServer({ display: display && !usesPush(), prefs: prefsRef.current });
        setUnread(res.unread ?? 0);
        const all = await notifApi.list();
        setItems(all.results ?? []);
      } catch {
        setItems((i) => i ?? []);
      }
    },
    [user],
  );

  // Canal Android, permission, rappel quotidien.
  useEffect(() => {
    setupChannels().catch(() => {});
    requestPermission().catch(() => {});
  }, []);
  useEffect(() => {
    scheduleReminder(settings.reminder, settings.reminderHour).catch(() => {});
  }, [settings.reminder, settings.reminderHour]);

  // Connecté : enregistrement push + interrogation régulière.
  useEffect(() => {
    if (!user) {
      setItems(null);
      setUnread(0);
      return undefined;
    }
    registerPush();
    refresh(false);
    const t = setInterval(() => AppState.currentState === "active" && refresh(true), prefsRef.current.dataSaver ? POLL_MS * 4 : POLL_MS);
    const sub = AppState.addEventListener("change", (s) => s === "active" && refresh(true));
    const offPush = onForegroundPush(() => refresh(false));
    return () => {
      clearInterval(t);
      sub.remove();
      offPush();
    };
  }, [user, refresh]);

  // Toucher une notification ouvre le bon écran.
  useEffect(() => {
    const go = (data) => data && openRef.current?.(data);
    initialNotificationData().then(go).catch(() => {});
    const off1 = onNotificationPress(go);
    const off2 = onPushOpened(go);
    return () => {
      off1();
      off2();
    };
  }, []);

  const markRead = useCallback(async (ids) => {
    setItems((list) => list?.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)) ?? list);
    setUnread((u) => (ids ? Math.max(0, u - ids.length) : 0));
    await notifApi.read(ids).catch(() => {});
  }, []);

  const clear = useCallback(async () => {
    setItems([]);
    setUnread(0);
    await notifApi.clear().catch(() => {});
  }, []);

  return (
    <NotificationsContext.Provider value={{ items, unread, refresh, markRead, clear }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
