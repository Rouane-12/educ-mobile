module.exports = {
  preset: "@react-native/jest-preset",
  setupFiles: ["./jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@react-native-async-storage|@react-native-firebase|@react-native-clipboard|@notifee|react-native-.*|lucide-react-native)/)",
  ],
  testTimeout: 30000,
};
