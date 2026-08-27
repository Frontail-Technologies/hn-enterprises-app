import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Must match app.json's expo-splash-screen plugin config exactly
// (imageWidth: 200, same logo.png, which is a 1:1 square asset - see
// assets/images/logo.png's own PNG header, 1254x1254) so the JS overlay's
// very first rendered frame is pixel-identical to the native splash's last
// frame. Any difference here is what causes a visible "pop" at the handoff.
const NATIVE_LOGO_SIZE = 200;
// Minimum time the overlay stays up so the branded motion is always visible,
// even when auth bootstrap resolves near-instantly - real readiness (below)
// can only extend this, never shorten it.
const MIN_VISIBLE_MS = 900;

export function AnimatedSplash() {
  const { isLoading } = useAuth();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Logo starts fully visible at native size (opacity 1, scale 1) - i.e. the
  // exact visual state the native splash was already showing - so there is
  // nothing to "reveal" at the handoff instant itself. The animation below
  // only adds a barely-there lift on top of that already-correct frame,
  // never a fade/scale-in from a different starting state.
  const logoScale = useSharedValue(1);
  const accentOpacity = useSharedValue(0);
  const accentWidth = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      const id = setTimeout(() => setMinTimeElapsed(true), 0);
      return () => clearTimeout(id);
    }

    logoScale.value = withTiming(1.03, { duration: 400, easing: Easing.out(Easing.cubic) });
    accentOpacity.value = withDelay(300, withTiming(1, { duration: 200 }));
    accentWidth.value = withDelay(
      300,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setMinTimeElapsed)(true);
      }),
    );
    // Fallback in case the animation callback above doesn't fire for any
    // reason - never leaves the overlay stuck up past MIN_VISIBLE_MS.
    const fallback = setTimeout(() => setMinTimeElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (!minTimeElapsed || isLoading) return;

    if (reduceMotion) {
      const id = setTimeout(() => setHidden(true), 0);
      return () => clearTimeout(id);
    }

    overlayOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(setHidden)(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minTimeElapsed, isLoading, reduceMotion]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));
  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
    width: 36 * accentWidth.value,
  }));

  if (hidden) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: colors.background }, overlayStyle]}
    >
      <Animated.View style={reduceMotion ? undefined : logoStyle}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
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
  accent: {
    marginTop: 16,
    height: 3,
    borderRadius: 999,
  },
});
