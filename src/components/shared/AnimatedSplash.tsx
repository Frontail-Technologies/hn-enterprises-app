import { usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  runOnJS,
  interpolateColor,
} from "react-native-reanimated";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const NATIVE_LOGO_SIZE = 200;
const SPLASH_BACKGROUND = "#11100D";
const MIN_VISIBLE_MS = 900;

export function AnimatedSplash() {
  const { isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const hasRealRoute = Boolean(pathname) && pathname !== "/";
  const nativeSplashHiddenRef = useRef(false);

  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0.9);
  const accentOpacity = useSharedValue(0);
  const accentWidth = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  const backgroundProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      backgroundProgress.value = 1;
      const id = setTimeout(() => setMinTimeElapsed(true), 0);
      return () => clearTimeout(id);
    }

    logoScale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    logoOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    if (!isDark) {
      backgroundProgress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    }
    accentOpacity.value = withDelay(300, withTiming(1, { duration: 200 }));
    accentWidth.value = withDelay(
      300,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setMinTimeElapsed)(true);
      }),
    );
    const fallback = setTimeout(() => setMinTimeElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, isDark]);

  useEffect(() => {
    if (!minTimeElapsed || isLoading || !hasRealRoute) return;

    if (reduceMotion) {
      const id = setTimeout(() => setHidden(true), 0);
      return () => clearTimeout(id);
    }

    overlayOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(setHidden)(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minTimeElapsed, isLoading, hasRealRoute, reduceMotion]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    backgroundColor: interpolateColor(backgroundProgress.value, [0, 1], [SPLASH_BACKGROUND, colors.background]),
  }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));
  const coloredLogoStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value,
  }));
  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
    width: 36 * accentWidth.value,
  }));

  const handleFirstFrameLayout = (_event: LayoutChangeEvent) => {
    if (nativeSplashHiddenRef.current) return;
    nativeSplashHiddenRef.current = true;
    void SplashScreen.hideAsync();
  };

  if (hidden) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]} onLayout={handleFirstFrameLayout}>
      <Animated.View style={reduceMotion ? undefined : logoStyle}>
        <Image
          source={require("../../../assets/images/logo-dark.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../../../assets/images/logo.png")}
          style={[styles.logo, styles.coloredLogo, reduceMotion ? { opacity: isDark ? 0 : 1 } : coloredLogoStyle]}
          resizeMode="contain"
        />
      </Animated.View>
      {reduceMotion ? null : (
        <Animated.View style={[styles.accent, { backgroundColor: colors.primary }, accentStyle]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  logo: {
    width: NATIVE_LOGO_SIZE,
    height: NATIVE_LOGO_SIZE,
  },
  coloredLogo: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  accent: {
    marginTop: 16,
    height: 3,
    borderRadius: 999,
  },
});
