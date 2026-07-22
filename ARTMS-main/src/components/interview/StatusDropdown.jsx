/**
 * StatusDropdown — select interview status with colored dot indicators.
 *
 * Props:
 *   value       string   current status key
 *   onChange    fn(val)  called with new status key
 *   disabled    bool
 */
import { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

export const STATUSES = [
  { value: "scheduled",  label: "Scheduled",  dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50"    },
  { value: "confirmed",  label: "Confirmed",  dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  { value: "done",       label: "Done",       dot: "bg-slate-400",   text: "text-slate-700",   bg: "bg-slate-100"  },
  { value: "cancelled",  label: "Cancelled",  dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50"     },
  { value: "no_show",    label: "No Show",    dot: "bg-orange-500",  text: "text-orange-700",  bg: "bg-orange-50"  },
];

export function StatusBadge({ status }) {
  const s = STATUSES.find((x) => x.value === status) ?? STATUSES[0];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", s.bg, s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export default function StatusDropdown({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = STATUSES.find((s) => s.value === value) ?? STATUSES[0];

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
          current.bg, current.text,
          disabled ? "cursor-default opacity-70" : "cursor-pointer hover:opacity-80"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
        {current.label}
        {!disabled && (
          <svg className="ml-0.5 h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {STATUSES.map((s) => (
            <li
              key={s.value}
              role="option"
              aria-selected={s.value === value}
              onClick={() => { onChange(s.value); setOpen(false); }}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold transition hover:bg-slate-50",
                s.value === value && "bg-slate-50"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", s.dot)} />
              <span className={s.text}>{s.label}</span>
              {s.value === value && (
                <svg className="ml-auto h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
