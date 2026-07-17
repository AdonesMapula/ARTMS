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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border border-[var(--artms-border)] bg-white shadow-xl flex flex-col max-h-[90vh]",
          "animate-[modalIn_160ms_ease-out]",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--artms-border)] px-5 py-4">
          <div>
            {title ? (
              <h3 className="text-base font-extrabold text-slate-900">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="px-5 py-4 min-h-0">{children}</div>
        <div className="border-t border-[var(--artms-border)] px-5 py-4">
          {footer ?? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

