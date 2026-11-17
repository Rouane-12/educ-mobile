/**
 * Le champ touché doit remonter au-dessus du clavier : on simule un clavier qui s'ouvre
 * sur un champ situé en bas de l'écran et on vérifie que la liste défile de la bonne quantité.
 */
import { Dimensions, Platform, TextInput } from "react-native";
import ReactTestRenderer, { act } from "react-test-renderer";
import { useKeyboardScroll } from "../src/lib/keyboard";

const Emitter = require("react-native/Libraries/EventEmitter/RCTDeviceEventEmitter").default;
const SHOW = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

test("le champ caché par le clavier remonte juste au-dessus", async () => {
  jest.useFakeTimers();
  const screenH = Dimensions.get("window").height;
  const kbH = 300;
  // Champ de 48 px placé tout en bas de l'écran (donc sous le futur clavier).
  const input = { measureInWindow: (cb) => cb(0, screenH - 60, 300, 48) };
  const spy = jest.spyOn(TextInput.State, "currentlyFocusedInput").mockReturnValue(input);
  const list = { scrollTo: jest.fn() };

  let kb;
  function Probe() {
    kb = useKeyboardScroll();
    kb.ref.current = list;
    return null;
  }
  await act(async () => {
    ReactTestRenderer.create(<Probe />);
  });
  // La liste était déjà défilée de 100 px.
  kb.onScroll({ nativeEvent: { contentOffset: { y: 100 } } });

  await act(async () => {
    Emitter.emit(SHOW, { endCoordinates: { height: kbH, screenY: screenH - kbH } });
    jest.advanceTimersByTime(200);
  });

  expect(list.scrollTo).toHaveBeenCalled();
  const { y } = list.scrollTo.mock.calls[0][0];
  // bas du champ (screenH - 12) doit finir 24 px au-dessus du clavier (screenH - 300).
  expect(y).toBe(100 + (screenH - 12) - (screenH - kbH - 24));

  await act(async () => {
    Emitter.emit(HIDE, {});
  });
  spy.mockRestore();
  jest.useRealTimers();
});
