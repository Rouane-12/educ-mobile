/**
 * Système de notifications de l'application EduBénin.
 *
 * 1. Notifications « serveur » (messages, défis, nouveaux quiz des profs…) : créées par le backend.
 *    - Application fermée ou en arrière-plan : poussées par Firebase Cloud Messaging (FCM) et affichées
 *      par le système avec le design EduBénin (canal « edubenin », couleur orange, petite icône).
 *    - Application ouverte : récupérées et affichées avec Notifee.
 *    - Sans Firebase configuré : l'application interroge le serveur dès qu'elle est ouverte / revient
 *      au premier plan, puis toutes les 30 s.
 * 2. Notifications locales : rappel de révision quotidien (programmé sur le téléphone, marche hors ligne)
 *    et « ta copie est corrigée » en fin d'épreuve.
 */
import notifee, { AndroidImportance, AndroidStyle, EventType, RepeatFrequency, TriggerType } from "@notifee/react-native";
import { Platform } from "react-native";
import { notifApi } from "../api/endpoints";
import { getJSON, K, setJSON } from "./storage";

export const CHANNEL_ID = "edubenin";
const REMINDER_ID = "edubenin-reminder";
const BRAND = "#ff7a1a";

let messagingModule;
/** Firebase est facultatif : sans google-services.json, on reste sur le mode « interrogation ». */
function messaging() {
  if (messagingModule === undefined) {
    try {
      const m = require("@react-native-firebase/messaging").default;
      m(); // lève une erreur si Firebase n'est pas configuré
      messagingModule = m;
    } catch {
      messagingModule = null;
    }
  }
  return messagingModule ? messagingModule() : null;
}

export async function setupChannels() {
  if (Platform.OS !== "android") return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: "EduBénin",
    description: "Messages, défis, quiz et rappels de révision",
    importance: AndroidImportance.HIGH,
    lights: true,
    lightColor: BRAND,
    vibration: true,
  });
}

/** Affiche une notification avec le style de l'application. */
export async function showNotification({ title, body = "", data = {} }) {
  await setupChannels();
  await notifee.displayNotification({
    title,
    body,
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: {
      channelId: CHANNEL_ID,
      smallIcon: "ic_notification",
      color: BRAND,
      pressAction: { id: "default", launchActivity: "default" },
      style: body.length > 60 ? { type: AndroidStyle.BIGTEXT, text: body } : undefined,
    },
    ios: { sound: "default", foregroundPresentationOptions: { banner: true, list: true, sound: true, badge: true } },
  });
}

export async function requestPermission() {
  const s = await notifee.requestPermission();
  return s.authorizationStatus >= 1;
}

/** Enregistre le téléphone auprès du serveur pour recevoir les push (si Firebase est configuré). */
export async function registerPush() {
  const m = messaging();
  if (!m) return null;
  try {
    if (Platform.OS === "ios") await m.registerDeviceForRemoteMessages();
    const token = await m.getToken();
    if (!token) return null;
    await notifApi.registerDevice(token, Platform.OS);
    await setJSON(K.pushToken, token);
    m.onTokenRefresh((t) => notifApi.registerDevice(t, Platform.OS).catch(() => {}));
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPush() {
  const token = await getJSON(K.pushToken, null);
  if (token) {
    await notifApi.unregisterDevice(token).catch(() => {});
    await setJSON(K.pushToken, null);
  }
}

/** Push reçu pendant que l'application est ouverte : on l'affiche nous-mêmes. */
export function onForegroundPush(handler) {
  const m = messaging();
  if (!m) return () => {};
  return m.onMessage(async (msg) => {
    await showNotification({
      title: msg.notification?.title ?? msg.data?.title ?? "EduBénin",
      body: msg.notification?.body ?? msg.data?.body ?? "",
      data: msg.data ?? {},
    });
    handler?.(msg);
  });
}

export const usesPush = () => Boolean(messaging());

/**
 * Récupère les nouvelles notifications du serveur ; si `display`, les affiche
 * (utile quand le push n'est pas disponible). Renvoie { unread, results }.
 */
export async function pollServer({ display = false, prefs = {} } = {}) {
  const last = await getJSON(K.lastNotif, null);
  const res = await notifApi.list(last ?? undefined);
  const fresh = res.results ?? [];
  if (fresh.length) {
    await setJSON(K.lastNotif, Math.max(...fresh.map((n) => n.id), last ?? 0));
    // Au tout premier lancement, on n'affiche pas tout l'historique d'un coup.
    if (display && last !== null) {
      for (const n of fresh.slice(0, 5).reverse()) {
        if (n.kind === "message" && prefs.notifMessages === false) continue;
        if (n.kind === "duel" && prefs.notifDuels === false) continue;
        if (n.kind === "quiz" && prefs.notifQuiz === false) continue;
        await showNotification({ title: n.title, body: n.body, data: { ...n.data, kind: n.kind } });
      }
    }
  }
  return res;
}

/** Rappel de révision chaque jour à l'heure choisie (programmé sur le téléphone). */
export async function scheduleReminder(enabled, hour = 18) {
  await notifee.cancelTriggerNotification(REMINDER_ID).catch(() => {});
  if (!enabled) return;
  await setupChannels();
  const at = new Date();
  at.setHours(hour, 0, 0, 0);
  if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
  await notifee.createTriggerNotification(
    {
      id: REMINDER_ID,
      title: "C'est l'heure de réviser 📚",
      body: "Un Quiz Questions IA de 10 minutes ? Ton examen se prépare un peu chaque jour.",
      data: { screen: "Quiz" },
      android: { channelId: CHANNEL_ID, smallIcon: "ic_notification", color: BRAND, pressAction: { id: "default" } },
    },
    { type: TriggerType.TIMESTAMP, timestamp: at.getTime(), repeatFrequency: RepeatFrequency.DAILY },
  );
}

/** Écoute les appuis sur les notifications (application ouverte). */
export function onNotificationPress(handler) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) handler(detail.notification?.data ?? {});
  });
}

/** Notification qui a ouvert l'application (application fermée). */
export async function initialNotificationData() {
  const n = await notifee.getInitialNotification();
  if (n) return n.notification?.data ?? {};
  const m = messaging();
  if (m) {
    const msg = await m.getInitialNotification().catch(() => null);
    if (msg) return msg.data ?? {};
  }
  return null;
}

export function onPushOpened(handler) {
  const m = messaging();
  if (!m) return () => {};
  return m.onNotificationOpenedApp((msg) => handler(msg?.data ?? {}));
}

/** À appeler dans index.js, hors de React (push reçu application fermée). */
export function registerBackgroundHandlers() {
  notifee.onBackgroundEvent(async () => {});
  const m = messaging();
  if (m) m.setBackgroundMessageHandler(async () => {});
}
