// Clavier : le champ en cours de saisie reste TOUJOURS visible, juste au-dessus du clavier.
//
// Depuis Android 15, l'app s'affiche « bord à bord » : Android ne réduit plus l'écran quand le clavier
// s'ouvre (adjustResize n'a plus d'effet), le clavier recouvrait donc les champs. On le gère nous-mêmes :
//  1. <KeyboardInset> réserve en bas la hauteur du clavier (toute l'app, et dans les fenêtres modales) ;
//  2. useKeyboardScroll() fait défiler la liste pour amener le champ touché au-dessus du clavier.
import { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Platform, TextInput, View } from "react-native";

const SHOW = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
/** Espace laissé entre le champ et le haut du clavier. */
const GAP = 24;

/** Hauteur actuelle du clavier (0 s'il est fermé). */
export function useKeyboardHeight() {
  const [h, setH] = useState(0);
  useEffect(() => {
    const s = Keyboard.addListener(SHOW, (e) => setH(e?.endCoordinates?.height ?? 0));
    const d = Keyboard.addListener(HIDE, () => setH(0));
    return () => {
      s.remove();
      d.remove();
    };
  }, []);
  return h;
}

/**
 * Réserve la place du clavier en bas de son contenu (Android). Sur iOS, les écrans utilisent
 * déjà KeyboardAvoidingView : on ne double pas l'espace.
 */
export function KeyboardInset({ children, style }) {
  const h = useKeyboardHeight();
  return <View style={[{ flex: 1, paddingBottom: Platform.OS === "android" ? h : 0 }, style]}>{children}</View>;
}

/** Champ actuellement en saisie (API de React Native, protégée si elle change). */
function focusedInput() {
  try {
    return TextInput.State.currentlyFocusedInput?.() ?? null;
  } catch {
    return null;
  }
}

/**
 * À brancher sur un ScrollView / FlatList qui contient des champs :
 *   const kb = useKeyboardScroll();  <ScrollView ref={kb.ref} onScroll={kb.onScroll} scrollEventThrottle={16} … />
 * Quand le clavier s'ouvre (ou qu'on touche un autre champ clavier ouvert), le champ remonte au-dessus du clavier.
 */
export function useKeyboardScroll(userOnScroll) {
  const ref = useRef(null);
  const offset = useRef(0);
  const kbTop = useRef(null);

  useEffect(() => {
    const bringIntoView = () => {
      const input = focusedInput();
      const list = ref.current;
      if (!input || !list || kbTop.current == null || typeof input.measureInWindow !== "function") return;
      input.measureInWindow((_x, y, _w, height) => {
        if (!Number.isFinite(y) || !height) return;
        const limit = kbTop.current - GAP;
        const bottom = y + Math.min(height, 160); // un grand champ multi-lignes : on montre au moins son début
        let delta = 0;
        if (bottom > limit) delta = bottom - limit;
        else if (y < 90) delta = y - 90; // champ caché sous l'en-tête : on le redescend
        if (Math.abs(delta) < 4) return;
        const y2 = Math.max(0, offset.current + delta);
        if (typeof list.scrollToOffset === "function") list.scrollToOffset({ offset: y2, animated: true });
        else list.scrollTo?.({ y: y2, animated: true });
      });
    };
    let timer = null;
    let poll = null;
    let last = null;
    const stopPoll = () => {
      if (poll) clearInterval(poll);
      poll = null;
    };
    const s = Keyboard.addListener(SHOW, (e) => {
      const top = e?.endCoordinates?.screenY;
      kbTop.current = Number.isFinite(top) && top > 0 ? top : Dimensions.get("window").height - (e?.endCoordinates?.height ?? 0);
      last = focusedInput();
      // Petit délai : on laisse l'écran se réduire (KeyboardInset) avant de mesurer.
      clearTimeout(timer);
      timer = setTimeout(bringIntoView, Platform.OS === "android" ? 90 : 30);
      // Clavier déjà ouvert et on touche un autre champ : Android n'envoie pas de nouvel événement.
      stopPoll();
      poll = setInterval(() => {
        const cur = focusedInput();
        if (cur && cur !== last) {
          last = cur;
          bringIntoView();
        }
      }, 300);
    });
    const d = Keyboard.addListener(HIDE, () => {
      kbTop.current = null;
      last = null;
      stopPoll();
    });
    return () => {
      s.remove();
      d.remove();
      clearTimeout(timer);
      stopPoll();
    };
  }, []);

  const onScroll = (e) => {
    offset.current = e.nativeEvent.contentOffset.y;
    userOnScroll?.(e);
  };
  return { ref, onScroll, scrollEventThrottle: 16, keyboardShouldPersistTaps: "handled" };
}
