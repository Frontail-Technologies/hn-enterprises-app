// Nothing installed a global JS error handler anywhere in the app before
// this. React Native exposes ErrorUtils (injected by its own polyfills, no
// extra dependency needed) specifically so an app can observe a fatal JS
// exception before the engine acts on it - without this, an uncaught error
// in an event handler or async callback has no app-level trail at all, only
// whatever generic crash report the OS/TestFlight happens to capture.
//
// This wraps, not replaces, the existing handler - the original behavior
// (red box in dev, whatever RN/Hermes does by default in release) still
// runs exactly as before. This only adds a console.error with full context
// first, so "safe logging" here means strictly additive, never suppresses
// or changes what happens to the error afterward.
declare const global: {
  ErrorUtils?: {
    getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
    setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;

  const errorUtils = global.ErrorUtils;
  if (errorUtils) {
    const originalHandler = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      console.error("[GlobalError] uncaught JS exception", {
        isFatal: Boolean(isFatal),
        message: error?.message,
        stack: error?.stack,
      });
      originalHandler(error, isFatal);
    });
  }

  // Hermes reports unhandled promise rejections through this global when
  // present (RN wires it up on newer versions) - same additive logging, no
  // behavior change.
  const globalWithRejectionHandler = global as unknown as {
    HermesInternal?: unknown;
    onunhandledrejection?: (event: { reason: unknown }) => void;
  };
  const existingRejectionHandler = globalWithRejectionHandler.onunhandledrejection;
  globalWithRejectionHandler.onunhandledrejection = (event) => {
    console.error("[GlobalError] unhandled promise rejection", { reason: event?.reason });
    existingRejectionHandler?.(event);
  };
}
