import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initClient, onLogout, tokens } from "../api/client";
import { authApi } from "../api/endpoints";
import { defaultSettings, getJSON, K, setJSON } from "../lib/storage";
import { palettes } from "../theme";

const AppContext = createContext(null);

/** Session (utilisateur connecté) + réglages (thème, taille du texte, notifications). */
export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [settings, setSettingsState] = useState(defaultSettings);

  const refreshUser = useCallback(async () => {
    if (!tokens.access && !tokens.refresh) {
      setUser(null);
      return null;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch (e) {
      if (e.status === 401) {
        await tokens.clear();
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    // Démarrage : l'interface s'affiche dès que le stockage local est lu (jamais bloquée par
    // une erreur ou par un serveur lent) ; le compte est vérifié ensuite en arrière-plan.
    let done = false;
    const open = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const safety = setTimeout(open, 4000);
    (async () => {
      try {
        await initClient();
        setSettingsState({ ...defaultSettings, ...(await getJSON(K.settings, {})) });
      } catch {
        /* réglages par défaut */
      } finally {
        clearTimeout(safety);
        open();
      }
      refreshUser().catch(() => {});
    })();
    return onLogout(() => setUser(null));
  }, [refreshUser]);

  const signIn = useCallback(async (payload) => {
    await tokens.set(payload);
    setUser(payload.user);
    return payload.user;
  }, []);

  const signOut = useCallback(async () => {
    await tokens.clear();
    setUser(null);
  }, []);

  const setSettings = useCallback((patch) => {
    setSettingsState((s) => {
      const next = { ...s, ...patch };
      setJSON(K.settings, next);
      return next;
    });
  }, []);

  const colors = palettes[settings.theme === "light" ? "light" : "dark"];

  const value = useMemo(
    () => ({
      ready,
      user,
      isProf: user?.role === "prof",
      isAdmin: Boolean(user?.is_admin ?? user?.role === "admin"),
      setUser,
      signIn,
      signOut,
      refreshUser,
      settings,
      setSettings,
      colors,
      fs: (size) => Math.round(size * (settings.fontScale || 1)),
    }),
    [ready, user, signIn, signOut, refreshUser, settings, setSettings, colors],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
export const useColors = () => useContext(AppContext).colors;
