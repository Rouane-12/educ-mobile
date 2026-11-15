// Historique EduIA : sur le serveur si connecté (partagé avec le site), sinon sur le téléphone.
import { aiApi } from "../api/endpoints";
import { uid } from "./format";
import { getJSON, K, setJSON } from "./storage";

export function titleFrom(text) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  return t.length > 80 ? `${t.slice(0, 77)}…` : t || "Nouvelle conversation";
}

export function aiHistory(isAuthed) {
  if (isAuthed)
    return {
      remote: true,
      list: () => aiApi.conversations(),
      get: (id) => aiApi.conversation(id),
      create: (title) => aiApi.createConversation(title),
      rename: (id, title) => aiApi.renameConversation(id, title),
      remove: (id) => aiApi.deleteConversation(id),
      save: async () => {},
    };
  const read = () => getJSON(K.aiHistory, []);
  return {
    remote: false,
    list: async () => (await read()).map(({ id, title, created_at, updated_at }) => ({ id, title, created_at, updated_at })),
    get: async (id) => (await read()).find((c) => c.id === id) ?? null,
    create: async (title) => {
      const now = new Date().toISOString();
      return { id: uid(), title: titleFrom(title), created_at: now, updated_at: now, messages: [] };
    },
    rename: async (id, title) => setJSON(K.aiHistory, (await read()).map((c) => (c.id === id ? { ...c, title: titleFrom(title) } : c))),
    remove: async (id) => setJSON(K.aiHistory, (await read()).filter((c) => c.id !== id)),
    save: async (conv, messages) => {
      const clean = messages.filter((m) => m.content && !m.content.startsWith("⚠️"));
      if (!clean.length) return;
      const rest = (await read()).filter((c) => c.id !== conv.id);
      await setJSON(K.aiHistory, [{ ...conv, messages: clean, updated_at: new Date().toISOString() }, ...rest].slice(0, 60));
    },
  };
}

export function groupByDate(list) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86400000;
  const groups = [
    { key: "today", label: "Aujourd'hui", items: [] },
    { key: "yesterday", label: "Hier", items: [] },
    { key: "week", label: "7 derniers jours", items: [] },
    { key: "month", label: "30 derniers jours", items: [] },
    { key: "older", label: "Plus ancien", items: [] },
  ];
  for (const c of list) {
    const t = new Date(c.updated_at || c.created_at).getTime();
    groups[t >= start ? 0 : t >= start - day ? 1 : t >= start - 7 * day ? 2 : t >= start - 30 * day ? 3 : 4].items.push(c);
  }
  return groups.filter((g) => g.items.length);
}
