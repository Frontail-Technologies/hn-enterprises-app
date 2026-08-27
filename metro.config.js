// Learn more https://docs.expo.dev/guides/customizing-metro
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// getSentryExpoConfig (not getDefaultConfig + withSentryConfig) is required here. Expo's own
// getDefaultConfig already installs its own serializer.customSerializer (for Expo Router's
// route manifest / env var injection), and wrapping that already-built config from the outside
// via withSentryConfig has broken release bundling in another Expo Router app on this same
// stack ("Cannot read properties of undefined (reading 'match')" from Sentry's debug-ID
// extraction during the release bundle step, reproduced across multiple @sentry/react-native
// versions there - not a one-off bad release). getSentryExpoConfig instead calls Expo's
// getDefaultConfig itself and registers Sentry's debug-ID plugin through Expo's own supported
// unstable_beforeAssetSerializationPlugins hook, which Expo's serializer actually calls into
// correctly.
const config = getSentryExpoConfig(__dirname);

module.exports = config;
