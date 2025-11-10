// jest.setup.js

// --- We're mocking every native module from your package.json ---

// 1. AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// 2. BLE-PLX
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn(() => ({
    createClient: jest.fn(),
    // ... add any other methods your app uses
  })),
}));

// 3. react-native-camera
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      Type: { back: 'back', front: 'front' },
      FlashMode: { on: 'on', off: 'off', auto: 'auto' },
      BarCodeType: { qr: 'qr' },
    },
  },
}));

// 4. react-native-permissions
jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
);

// 5. vision-camera
jest.mock('react-native-vision-camera', () => ({
  useCameraDevice: jest.fn(),
  useFrameProcessor: jest.fn(),
  Camera: jest.fn(),
}));

// 6. react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    View: View,
    NativeButton: View,
    TouchableOpacity: View,
    TouchableHighlight: View,
    TouchableNativeFeedback: View,
    TouchableWithoutFeedback: View,
    GestureHandlerRootView: View,
  };
});

// 7. reanimated
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useSharedValue: jest.fn,
  useAnimatedStyle: jest.fn,
  withTiming: jest.fn,
  withSpring: jest.fn,
}));

// 8. react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');
// Add any other icon sets you use here

// 9. react-native-progress
jest.mock('react-native-progress', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return { Bar: View, Circle: View, Pie: View };
});

// 10. react-native-qrcode-scanner
jest.mock('react-native-qrcode-scanner', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return View;
});

// --- New mocks for packages that would have crashed next ---

// 11. react-native-get-random-values
jest.mock('react-native-get-random-values', () => ({
  getRandomBase64: jest.fn(),
}));

// 12. @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return View;
});

// 13. @react-native-picker/picker
jest.mock('@react-native-picker/picker', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return View;
});

// 14. react-native-safe-area-context
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock'),
);

// 15. react-native-screens
jest.mock('react-native-screens', () => ({
  ...jest.requireActual('react-native-screens'),
  enableScreens: jest.fn(),
}));

// 16. react-native-svg
jest.mock('react-native-svg', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    ...jest.requireActual('react-native-svg'),
    Svg: View,
    Path: View, // Mock specific SVG components you use
    Circle: View,
    Rect: View,
  };
});

// 17. Mock Navigation Hooks (MODIFIED)
// We are now using the REAL NavigationContainer,
// but we still mock the hooks it provides.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'), // <-- Use the REAL one
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// 18. Mock Native Stack Navigator (NEW)
// This is the component that's actually crashing.
// We mock its implementation.
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => {
      const React = require('react');
      return <>{children}</>; // Just render the children (the screens)
    },
    // Mock the Screen component to render nothing
    Screen: () => null,
  }),
}));

// 19. Mock Bottom Tab Navigator (NEW)
// Your App.tsx also uses this, so it would be the next crash.
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => {
      const React = require('react');
      return <>{children}</>; // Just render the children
    },
    // Mock the Screen component to render nothing
    Screen: () => null,
  }),
}));