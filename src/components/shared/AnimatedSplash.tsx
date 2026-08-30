import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
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

// Must match app.json's expo-splash-screen plugin config exactly
// (imageWidth: 200, same logo.png, which is a 1:1 square asset - see
// assets/images/logo.png's own PNG header, 1254x1254) so the JS overlay's
// very first rendered frame is pixel-identical to the native splash's last
// frame. Any difference here is what causes a visible "pop" at the handoff.
const NATIVE_LOGO_SIZE = 200;
// Native splash can never know the resolved app theme before JS starts - it
// has no access to the persisted themePreference in AsyncStorage, only the
// OS-level light/dark setting, which can legitimately differ from what the
// user has explicitly forced HN to. Using ONE fixed background here (that
// exactly matches app.json's splash `backgroundColor` - see the dark theme
// palette in ThemeContext.tsx, where this is also the actual dark
// background) means the native -> JS handoff is pixel-identical regardless
// of system mode vs forced light vs forced dark. If the resolved theme
// turns out to be light, the overlay animates from this into the real light
// background below, rather than the native layer guessing wrong.
const SPLASH_BACKGROUND = "#11100D";
// Minimum time the overlay stays up so the branded motion is always visible,
// even when auth bootstrap resolves near-instantly - real readiness (below)
// can only extend this, never shorten it.
const MIN_VISIBLE_MS = 900;

export function AnimatedSplash() {
  const { isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  // app/index.tsx renders null while isLoading, then a <Redirect> that
  // itself needs another render+navigation commit before a real screen
  // (Home/Login) is actually mounted - isLoading alone flips false a beat
  // before that lands, which let this overlay start fading (or a
  // reduced-motion user's overlay unmount outright) over that in-between
  // "/" route's empty paint. usePathname() reflects the actually-committed
  // route, so gating on it too closes that gap regardless of how long the
  // redirect takes on a given run, instead of assuming it's always fast.
  const pathname = usePathname();
  const hasRealRoute = Boolean(pathname) && pathname !== "/";

  // Deliberate, small departure from the native splash's last frame (scale 1,
  // opacity 1): starting a hair below full size/opacity and zooming up to 1
  // reads as an intentional "arrival" motion instead of the logo just sitting
  // static. The gap is kept tiny (0.92, not e.g. 0.7) specifically so the
  // handoff pop this introduces stays at the edge of perceptible rather than
  // a visible jump - reduced-motion users never see it (logoStyle isn't
  // applied at all in that branch, so the View renders at its natural scale/
  // opacity of 1 with no transform).
  const logoScale = useSharedValue(0.92);
  const logoOpacity = useSharedValue(0.92);
  const accentOpacity = useSharedValue(0);
  const accentWidth = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  // 0 = SPLASH_BACKGROUND (matches native exactly), 1 = the resolved app
  // background. Dark theme's own background already equals
  // SPLASH_BACKGROUND (see ThemeContext.tsx), so this only ever animates
  // when the resolved theme is light.
  const backgroundProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      // No animated transition - jump straight to the correct resolved
      // background instead of holding the splash color for the fixed
      // fallback duration below.
      backgroundProgress.value = 1;
      const id = setTimeout(() => setMinTimeElapsed(true), 0);
      return () => clearTimeout(id);
    }

    logoScale.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    logoOpacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
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
    // Fallback in case the animation callback above doesn't fire for any
    // reason - never leaves the overlay stuck up past MIN_VISIBLE_MS.
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
  // The native splash (fixed dark background, before JS starts) always shows
  // the monochrome logo - it's the only one that reads on that background.
  // The colored logo only fades in here, in lockstep with the same
  // backgroundProgress driving the background transition above, so a
  // resolved-light theme crossfades logo and background together as one
  // motion instead of the logo silently popping between assets. A resolved-
  // dark theme never animates backgroundProgress past 0, so the colored
  // layer just stays fully transparent and the monochrome logo never changes.
  const coloredLogoStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value,
  }));
  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
    width: 36 * accentWidth.value,
  }));

  if (hidden) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
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
