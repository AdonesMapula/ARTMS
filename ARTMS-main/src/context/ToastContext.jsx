import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: {
    bg: "bg-white border-emerald-300 text-emerald-900 shadow-emerald-500/10",
    iconBg: "bg-emerald-100 text-emerald-600",
    icon: CheckCircle2,
    progress: "bg-emerald-500",
    btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  error: {
    bg: "bg-white border-rose-300 text-rose-900 shadow-rose-500/10",
    iconBg: "bg-rose-100 text-rose-600",
    icon: XCircle,
    progress: "bg-rose-500",
    btn: "bg-rose-600 hover:bg-rose-700 text-white",
  },
  warning: {
    bg: "bg-white border-amber-300 text-amber-900 shadow-amber-500/10",
    iconBg: "bg-amber-100 text-amber-600",
    icon: AlertTriangle,
    progress: "bg-amber-500",
    btn: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    bg: "bg-white border-blue-300 text-blue-900 shadow-blue-500/10",
    iconBg: "bg-blue-100 text-blue-600",
    icon: Info,
    progress: "bg-blue-500",
    btn: "bg-[#111A62] hover:bg-[#0d1550] text-white",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = "info", duration = 4500, actionLabel, onAction }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, message, type, duration, actionLabel, onAction };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Bind global helper for non-React/Axios usage
  useEffect(() => {
    window.artmsToast = {
      success: (title, message, opts) => showToast({ title, message, type: "success", ...opts }),
      error: (title, message, opts) => showToast({ title, message, type: "error", ...opts }),
      warning: (title, message, opts) => showToast({ title, message, type: "warning", ...opts }),
      info: (title, message, opts) => showToast({ title, message, type: "info", ...opts }),
      show: showToast,
    };
  }, [showToast]);

  const toastHelpers = {
    showToast,
    success: (title, message, opts) => showToast({ title, message, type: "success", ...opts }),
    error: (title, message, opts) => showToast({ title, message, type: "error", ...opts }),
    warning: (title, message, opts) => showToast({ title, message, type: "warning", ...opts }),
    info: (title, message, opts) => showToast({ title, message, type: "info", ...opts }),
    removeToast,
  };

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}

      {/* Floating System Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.type] || VARIANT_STYLES.info;
          const IconComp = style.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-[slideInRight_0.25s_ease-out] ${style.bg}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-2 shrink-0 ${style.iconBg}`}>
                  <IconComp size={20} />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  {t.title && (
                    <h4 className="text-sm font-extrabold tracking-tight leading-snug">
                      {t.title}
                    </h4>
                  )}
                  {t.message && (
                    <p className="mt-0.5 text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {t.message}
                    </p>
                  )}

                  {t.actionLabel && typeof t.onAction === "function" && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          t.onAction();
                          removeToast(t.id);
                        }}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${style.btn}`}
                      >
                        {t.actionLabel}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="absolute top-3.5 right-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Close Notification"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
