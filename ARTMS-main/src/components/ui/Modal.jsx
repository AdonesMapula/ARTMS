import { useEffect } from "react";
import { cn } from "../../utils/cn";
import Button from "./Button";

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  className,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center cursor-pointer backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "w-full max-w-2xl rounded-2xl border border-[var(--artms-border)] bg-white shadow-2xl flex flex-col max-h-[92vh] cursor-default",
          "animate-[modalIn_180ms_ease-out]",
          className
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--artms-border)] bg-slate-50/80 px-6 py-5 rounded-t-2xl">
          <div className="flex-1">
            {title ? (
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95 cursor-pointer"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">{children}</div>

        {/* Footer */}
        <div className="border-t border-[var(--artms-border)] bg-slate-50/50 px-6 py-4 rounded-b-2xl">
          {footer ?? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="cursor-pointer">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
