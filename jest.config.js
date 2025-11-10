module.exports = {
  preset: 'react-native',

  // This regex now includes every package from your package.json
  // that is known to cause the 'Unexpected token' error.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-ble-plx|react-native-camera|react-native-gesture-handler|react-native-permissions|react-native-progress|react-native-qrcode-scanner|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-vector-icons|react-native-vision-camera)/)',
  ],

  // This points to our one-stop-shop mock file.
  setupFilesAfterEnv: ['./jest.setup.js'],
};