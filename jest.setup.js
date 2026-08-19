// Official mock from the package itself - any test that transitively
// imports a module touching AsyncStorage (useDraftForm, AttendanceContext,
// etc.) needs this, since jest-expo's preset doesn't mock third-party
// native modules on its own, only first-party Expo ones.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
