// Client HTTP vers le backend Django (même API que le site) : JWT + renouvellement automatique.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import { DEFAULT_API_URL } from "../config/env";
import { K } from "../lib/storage";

let API_BASE = DEFAULT_API_URL;
let access = null;
let refresh = null;
const listeners = new Set();

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Charge l'adresse du serveur et les jetons enregistrés (au démarrage). */
export async function initClient() {
  // AsyncStorage v3 : getMany renvoie un objet { clé: valeur } (multiGet n'existe plus).
  try {
    const v = await AsyncStorage.getMany([K.apiUrl, K.access, K.refresh]);
    if (v[K.apiUrl]) API_BASE = v[K.apiUrl];
    access = v[K.access] || null;
    refresh = v[K.refresh] || null;
  } catch {
    access = null;
    refresh = null;
  }
}

export const getApiBase = () => API_BASE;
export async function setApiBase(url) {
  API_BASE = (url || DEFAULT_API_URL).replace(/\/$/, "");
  if (url) await AsyncStorage.setItem(K.apiUrl, API_BASE);
  else await AsyncStorage.removeItem(K.apiUrl);
}

export const apiUrl = (path) => (!path ? "" : /^https?:/.test(path) ? path : `${API_BASE}${path}`);

export const tokens = {
  get access() {
    return access;
  },
  get refresh() {
    return refresh;
  },
  async set(t) {
    if (t.access) access = t.access;
    if (t.refresh) refresh = t.refresh;
    await AsyncStorage.setMany({ [K.access]: access ?? "", [K.refresh]: refresh ?? "" }).catch(() => {});
  },
  async clear() {
    access = null;
    refresh = null;
    await AsyncStorage.removeMany([K.access, K.refresh]).catch(() => {});
  },
};

/** Prévenu quand la session expire (refresh refusé). */
export const onLogout = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

let refreshing = null;
async function refreshAccess() {
  if (!refresh) return false;
  refreshing ??= fetchWithTimeout(
    apiUrl("/api/auth/refresh/"),
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh }) },
    20000,
  )
    .then(async (r) => {
      if (!r.ok) {
        await tokens.clear();
        listeners.forEach((fn) => fn());
        return false;
      }
      await tokens.set(await r.json());
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** fetch avec délai maximal : un serveur injoignable ne bloque jamais l'application. */
function fetchWithTimeout(url, init, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

export async function rawFetch(path, init = {}, retry = true) {
  const headers = { ...(init.headers || {}) };
  if (access) headers.Authorization = `Bearer ${access}`;
  // Génération / correction par l'IA : jusqu'à ~2 min 30 côté serveur.
  const ms = init.timeout ?? (path.startsWith("/api/ai/") ? 200000 : 20000);
  const res = await fetchWithTimeout(apiUrl(path), { ...init, headers }, ms);
  if (res.status === 401 && retry && refresh) {
    if (await refreshAccess()) return rawFetch(path, init, false);
  }
  return res;
}

/** Requête JSON. `body` objet -> JSON, FormData -> multipart. */
export async function api(path, { method = "GET", body, query } = {}) {
  let url = path;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }
  const init = { method };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  const cacheKey = method === "GET" ? `edubenin:cache:${url}` : null;
  let res;
  try {
    res = await rawFetch(url, init);
  } catch {
    // Hors ligne : on renvoie la dernière réponse connue (marquée `offline`) pour que l'écran reste utilisable.
    if (cacheKey) {
      const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);
      if (cached) {
        offlineListeners.forEach((fn) => fn(true));
        return JSON.parse(cached);
      }
    }
    throw new ApiError("Pas de connexion. Vérifie ton Internet ou le mode avion.", 0);
  }
  offlineListeners.forEach((fn) => fn(false));
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 402 && data?.code === "quota") DeviceEventEmitter.emit("edubenin:paywall", data);
    throw new ApiError(data?.error || data?.detail || `Erreur ${res.status}`, res.status, data);
  }
  if (cacheKey && data != null) AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
  return data;
}

const offlineListeners = new Set();
/** Prévenu quand l'application passe hors ligne (données en cache) ou revient en ligne. */
export const onOffline = (fn) => {
  offlineListeners.add(fn);
  return () => offlineListeners.delete(fn);
};

/** Vide le cache hors ligne (déconnexion, changement de compte). */
export async function clearApiCache() {
  const keys = (await AsyncStorage.getAllKeys().catch(() => [])).filter((k) => k.startsWith("edubenin:cache:"));
  if (keys.length) await AsyncStorage.removeMany(keys).catch(() => {});
}

/**
 * Flux SSE d'EduIA. `fetch` de React Native ne lit pas les réponses en continu :
 * on passe par XMLHttpRequest, dont `onprogress` livre le texte au fur et à mesure.
 * Renvoie { promise, abort }.
 */
export function streamChat(body, onDelta) {
  const xhr = new XMLHttpRequest();
  let seen = 0;
  let buffer = "";
  const handleChunk = () => {
    const text = xhr.responseText || "";
    buffer += text.slice(seen);
    seen = text.length;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      const payload = line?.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let obj;
      try {
        obj = JSON.parse(payload);
      } catch {
        continue;
      }
      if (obj.error) throw new Error(typeof obj.error === "string" ? obj.error : "Erreur EduIA");
      const delta = obj?.choices?.[0]?.delta?.content;
      if (delta) onDelta(delta);
    }
  };

  const send = (retry) =>
    new Promise((resolve, reject) => {
      xhr.open("POST", apiUrl("/api/ai/chat/"));
      xhr.setRequestHeader("Content-Type", "application/json");
      if (access) xhr.setRequestHeader("Authorization", `Bearer ${access}`);
      xhr.onprogress = () => {
        if (xhr.status !== 200) return;
        try {
          handleChunk();
        } catch (e) {
          xhr.abort();
          reject(e);
        }
      };
      xhr.onload = async () => {
        if (xhr.status === 401 && retry && (await refreshAccess())) {
          seen = 0;
          buffer = "";
          resolve(send(false));
          return;
        }
        if (xhr.status !== 200) {
          let data = {};
          try {
            data = JSON.parse(xhr.responseText) || {};
          } catch {
            /* rien */
          }
          if (xhr.status === 402 && data.code === "quota") DeviceEventEmitter.emit("edubenin:paywall", data);
          reject(Object.assign(new Error(data.error || `Erreur ${xhr.status}`), { status: xhr.status, code: data.code }));
          return;
        }
        try {
          buffer += "\n\n";
          handleChunk();
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      xhr.onerror = () => reject(new Error("Serveur injoignable"));
      xhr.onabort = () => reject(Object.assign(new Error("Réponse interrompue"), { name: "AbortError" }));
      xhr.send(JSON.stringify(body));
    });

  return { promise: send(true), abort: () => xhr.abort() };
}
