/* Simulations des modules natifs pour tester l'application sans téléphone ni émulateur. */
/* eslint-env jest */

// Stockage local : EXACTEMENT l'API de @react-native-async-storage v3 (pas de multiGet/multiSet),
// pour attraper tout appel à une fonction qui n'existe plus.
jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map();
  const api = {
    getItem: async (k) => store.get(k) ?? null,
    setItem: async (k, v) => void store.set(k, v),
    removeItem: async (k) => void store.delete(k),
    getMany: async (keys) => Object.fromEntries(keys.map((k) => [k, store.get(k) ?? null])),
    setMany: async (entries) => Object.entries(entries).forEach(([k, v]) => store.set(k, v)),
    removeMany: async (keys) => keys.forEach((k) => store.delete(k)),
    getAllKeys: async () => [...store.keys()],
    clear: async () => store.clear(),
  };
  return { __esModule: true, default: api, ...api };
});

jest.mock("@notifee/react-native", () => require("@notifee/react-native/jest-mock"));

// Firebase non configuré (comme sur un téléphone sans google-services.json).
jest.mock("@react-native-firebase/messaging", () => ({
  __esModule: true,
  default: () => {
    throw new Error("No Firebase App '[DEFAULT]' has been created");
  },
}));

jest.mock("react-native-linear-gradient", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("@react-native-clipboard/clipboard", () => ({ __esModule: true, default: { setString: jest.fn(), getString: jest.fn(async () => "") } }));

jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

// Icônes : de simples vues (le rendu SVG n'a pas d'intérêt ici).
jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const icon = (name) => {
    const C = (props) => React.createElement(View, { testID: `icon-${name}`, style: props.style });
    C.displayName = name;
    return C;
  };
  return new Proxy({ __esModule: true }, { get: (t, name) => (name in t ? t[name] : icon(String(name))) });
});

jest.mock("react-native-image-picker", () => ({ launchCamera: jest.fn(async () => ({ assets: [] })), launchImageLibrary: jest.fn(async () => ({ assets: [] })) }));
jest.mock("@react-native-documents/picker", () => ({ pick: jest.fn(async () => []), types: { pdf: "application/pdf", audio: "audio/*" } }));

// Connexion Google : l'utilisateur annule (aucun appel natif en test).
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({ type: "cancelled", data: null })),
    signOut: jest.fn(async () => null),
  },
  statusCodes: { SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED", IN_PROGRESS: "IN_PROGRESS", PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE" },
  isErrorWithCode: (e) => Boolean(e && e.code),
  isSuccessResponse: (r) => r?.type === "success",
}));

// Dessins vectoriels (logo Google) : rendus comme de simples vues.
jest.mock("react-native-svg", () => {
  const { View } = require("react-native");
  const C = (p) => require("react").createElement(View, p);
  return { __esModule: true, default: C, Svg: C, Path: C, Circle: C, Rect: C, G: C, Defs: C, LinearGradient: C, Stop: C };
});

// Animations : terminées instantanément en test (sinon leurs minuteurs survivent à la fin des tests).
{
  const { Animated } = require("react-native");
  const done = (cb) => cb && cb({ finished: true });
  const instant = (value, config) => ({
    start: (cb) => {
      if (config && typeof config.toValue === "number") value.setValue(config.toValue);
      done(cb);
    },
    stop() {},
    reset() {},
  });
  const group = (list) => ({
    start: (cb) => {
      (list || []).forEach((a) => a && a.start());
      done(cb);
    },
    stop() {},
    reset() {},
  });
  Animated.timing = instant;
  Animated.spring = instant;
  Animated.decay = instant;
  Animated.sequence = group;
  Animated.parallel = group;
  Animated.stagger = (_t, list) => group(list);
  Animated.loop = () => ({ start() {}, stop() {}, reset() {} });
}
