import { captureUnexpectedError } from "@/lib/sentry";

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
      captureUnexpectedError(error);
      originalHandler(error, isFatal);
    });
  }

  const globalWithRejectionHandler = global as unknown as {
    HermesInternal?: unknown;
    onunhandledrejection?: (event: { reason: unknown }) => void;
  };
  const existingRejectionHandler = globalWithRejectionHandler.onunhandledrejection;
  globalWithRejectionHandler.onunhandledrejection = (event) => {
    console.error("[GlobalError] unhandled promise rejection", { reason: event?.reason });
    captureUnexpectedError(event?.reason);
    existingRejectionHandler?.(event);
  };
}
