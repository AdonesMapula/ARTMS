import { useEffect } from "react";
import { cn } from "../../utils/cn";

const VARIANTS = {
  success: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#dcfce7" />
        <path
          d="M7 12.5l3.5 3.5 6.5-7"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    ring:   "ring-green-200",
    title:  "text-green-800",
    btn:    "bg-[#111A62] hover:bg-[#0d1550] text-white",
  },
  error: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#fee2e2" />
        <path
          d="M8 8l8 8M16 8l-8 8"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    ring:  "ring-red-200",
    title: "text-red-800",
    btn:   "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#fef9c3" />
        <path
          d="M12 8v4M12 15.5v.5"
          stroke="#ca8a04"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    ring:  "ring-yellow-200",
    title: "text-yellow-800",
    btn:   "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
  info: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#dbeafe" />
        <path
          d="M12 11v5M12 8.5v.5"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    ring:  "ring-blue-200",
    title: "text-blue-800",
    btn:   "bg-[#111A62] hover:bg-[#0d1550] text-white",
  },
};

/**
 * AlertModal — a polished replacement for native browser alert().
 *
 * Props:
 *   open        boolean          — show/hide
 *   variant     "success" | "error" | "warning" | "info"   default "info"
 *   title       string           — bold heading
 *   message     string|ReactNode — body text
 *   confirmLabel string          — button label  default "OK"
 *   onClose     () => void       — called on button click or Escape / backdrop
 */
export default function AlertModal({
  open,
  variant = "info",
  title,
  message,
  confirmLabel = "OK",
  onClose,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.info;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      aria-describedby="alert-modal-message"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1",
          v.ring,
          "animate-[modalIn_160ms_ease-out]"
        )}
      >
        {/* Body */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-5 text-center">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100">
            {v.icon}
          </div>

          {/* Title */}
          {title && (
            <h3
              id="alert-modal-title"
              className={cn("text-base font-extrabold", v.title)}
            >
              {title}
            </h3>
          )}

          {/* Message */}
          {message && (
            <p
              id="alert-modal-message"
              className="text-sm text-slate-600 leading-relaxed"
            >
              {message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex justify-center">
          <button
            autoFocus
            onClick={onClose}
            className={cn(
              "min-w-[7rem] rounded-xl px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              v.btn
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
