// Stockage local du téléphone : jetons, réglages, favoris, historique des quiz, historique EduIA hors connexion.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const K = {
  access: "edubenin:access",
  refresh: "edubenin:refresh",
  settings: "edubenin:settings",
  favorites: "edubenin:favorites",
  quizHistory: "edubenin:quizHistory",
  aiFavs: "edubenin:aiFavs",
  aiHistory: "edubenin:aiHistory",
  apiUrl: "edubenin:apiUrl",
  lastNotif: "edubenin:lastNotif",
  pushToken: "edubenin:pushToken",
};

export async function getJSON(key, fallback) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage plein */
  }
}

export const defaultSettings = {
  theme: "dark",
  fontScale: 1,
  reminder: true, // rappel de révision quotidien
  reminderHour: 18,
  notifMessages: true,
  notifDuels: true,
  notifQuiz: true,
  dataSaver: false, // économie de données
};

export const localStore = {
  async favorites() {
    return getJSON(K.favorites, []);
  },
  async toggleFavorite(exam) {
    const cur = await this.favorites();
    const exists = cur.some((e) => e.id === exam.id);
    const next = exists ? cur.filter((e) => e.id !== exam.id) : [exam, ...cur];
    await setJSON(K.favorites, next);
    return !exists;
  },
  async quizHistory() {
    return getJSON(K.quizHistory, []);
  },
  async addQuizResult(r) {
    const cur = await this.quizHistory();
    await setJSON(K.quizHistory, [r, ...cur].slice(0, 200));
  },
  async aiFavs() {
    return getJSON(K.aiFavs, []);
  },
  async addAiFav(item) {
    const cur = await this.aiFavs();
    await setJSON(K.aiFavs, [item, ...cur].slice(0, 100));
  },
  async removeAiFav(id) {
    const cur = (await this.aiFavs()).filter((f) => f.id !== id);
    await setJSON(K.aiFavs, cur);
    return cur;
  },
  async clearAll() {
    await AsyncStorage.removeMany([K.favorites, K.quizHistory, K.aiFavs, K.aiHistory, K.settings]).catch(() => {});
  },
};
