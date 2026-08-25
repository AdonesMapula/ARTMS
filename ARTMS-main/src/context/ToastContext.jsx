import { createContext, useContext, useEffect, useCallback } from "react";
import { toast as sonnerToast } from "sonner";
import { Toaster } from "../components/ui/sonner";

const ToastContext = createContext(null);

/**
 * Normalizes arguments for toast calls.
 * Supports:
 *   - toast.success("Message")
 *   - toast.success("Title", "Description")
 *   - toast.success("Title", { description: "...", action: ... })
 */
function normalizeToastArgs(arg1, arg2, opts = {}) {
  let title = arg1;
  let options = typeof arg2 === "object" ? { ...arg2, ...opts } : { ...opts };

  if (typeof arg2 === "string") {
    options.description = arg2;
  }

  return { title, options };
}

export function ToastProvider({ children }) {
  const showToast = useCallback(({ title, message, type = "info", duration = 4000, actionLabel, onAction }) => {
    const opts = {
      duration,
      ...(message ? { description: message } : {}),
      ...(actionLabel && onAction
        ? {
            action: {
              label: actionLabel,
              onClick: onAction,
            },
          }
        : {}),
    };

    switch (type) {
      case "success":
        return sonnerToast.success(title || message, opts);
      case "error":
        return sonnerToast.error(title || message, opts);
      case "warning":
        return sonnerToast.warning(title || message, opts);
      case "info":
      default:
        return sonnerToast.info(title || message, opts);
    }
  }, []);

  const toastHelpers = {
    showToast,
    success: (arg1, arg2, opts) => {
      const { title, options } = normalizeToastArgs(arg1, arg2, opts);
      return sonnerToast.success(title, options);
    },
    error: (arg1, arg2, opts) => {
      const { title, options } = normalizeToastArgs(arg1, arg2, opts);
      return sonnerToast.error(title, options);
    },
    warning: (arg1, arg2, opts) => {
      const { title, options } = normalizeToastArgs(arg1, arg2, opts);
      return sonnerToast.warning(title, options);
    },
    info: (arg1, arg2, opts) => {
      const { title, options } = normalizeToastArgs(arg1, arg2, opts);
      return sonnerToast.info(title, options);
    },
    dismiss: (id) => sonnerToast.dismiss(id),
    removeToast: (id) => sonnerToast.dismiss(id),
    raw: sonnerToast,
  };

  // Bind global helper for non-React/Axios usage
  useEffect(() => {
    window.artmsToast = {
      success: toastHelpers.success,
      error: toastHelpers.error,
      warning: toastHelpers.warning,
      info: toastHelpers.info,
      show: showToast,
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { sonnerToast as toast };
