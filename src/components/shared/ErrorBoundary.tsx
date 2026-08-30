import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Sentry from "@sentry/react-native";

const FALLBACK_COLORS = {
  background: "#F5F5F3",
  card: "#FFFFFF",
  border: "#E6E1D9",
  text: "#102033",
  muted: "#64748B",
  primary: "#FF7900",
};

type ErrorBoundaryProps = {
  children: ReactNode;
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
