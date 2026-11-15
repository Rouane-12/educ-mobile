/**
 * Point d'entrée de l'application mobile EduBénin (React Native CLI).
 * @format
 */
import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
import { registerBackgroundHandlers } from "./src/lib/notifications";

// Notifications reçues application fermée (push Firebase / appuis Notifee).
registerBackgroundHandlers();

AppRegistry.registerComponent(appName, () => App);
