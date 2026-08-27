import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Sentry from "@sentry/react-native";

// Nothing in this file existed anywhere in the app before this pass - there
// was no React error boundary at all, meaning a render-time JS exception
// anywhere below it (e.g. a screen dereferencing undefined data right after
// a button navigates to it) unmounted the whole tree with zero diagnostic
// trail. That's structurally indistinguishable from "pressing a button
// crashed the app" and was previously uninvestigatable.
//
// This does NOT hide crashes - componentDidCatch always logs full context
// (error, stack, component stack) before rendering the fallback, and the
// fallback itself is a visible "something broke" screen, not a silent
// no-op. It only catches render-phase errors in the React tree below it;
// it cannot catch errors in event handlers, async code, or true native
// crashes - see reportUnhandledError in errorReporting.ts for those.
//
// Colors are hardcoded (not pulled from ThemeContext) deliberately: this
// screen must be able to render on its own even if something theme/context
// -related is implicated in the crash it's catching.
const FALLBACK_COLORS = {
  background: "#F9F6EE",
  card: "#FFFFFF",
  border: "#E6E1D9",
  text: "#102033",
  muted: "#64748B",
  primary: "#FF7900",
};

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Distinguishes which boundary caught the error in logs, when more than one is mounted. */
  label?: string;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}] caught render error`, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Pressable onPress={this.reset} style={styles.button}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  // absoluteFill (not flex: 1) - this can render deep inside a chain of
  // context providers (BottomSheetModalProvider among them) that don't all
  // reliably pass flex:1 down to their children, which left flex: 1 here
  // collapsing to content height and pinning the fallback to the top of
  // the screen instead of centering it. Absolute fill guarantees full-
  // screen coverage regardless of ancestor layout.
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: FALLBACK_COLORS.background,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    gap: 14,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FALLBACK_COLORS.border,
    backgroundColor: FALLBACK_COLORS.card,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: FALLBACK_COLORS.text,
    textAlign: "center",
  },
  button: {
    marginTop: 6,
    height: 44,
    minWidth: 140,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FALLBACK_COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
