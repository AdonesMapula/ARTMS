/**
 * StatusDropdown — select interview status with colored dot indicators.
 *
 * Uses Radix Popover Portal so the dropdown is rendered outside table overflow bounds,
 * completely preventing clipping issues on single-row or scrollable tables.
 *
 * Props:
 *   value       string   current status key
 *   onChange    fn(val)  called with new status key
 *   disabled    bool
 */
import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../utils/cn";

export const STATUSES = [
  { value: "scheduled",  label: "Scheduled",  dot: "bg-blue-500",    text: "text-blue-700 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40"    },
  { value: "confirmed",  label: "Confirmed",  dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { value: "done",       label: "Done",       dot: "bg-slate-400",   text: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-800"  },
  { value: "cancelled",  label: "Cancelled",  dot: "bg-red-500",     text: "text-red-700 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-950/40"     },
  { value: "no_show",    label: "No Show",    dot: "bg-orange-500",  text: "text-orange-700 dark:text-orange-400",  bg: "bg-orange-50 dark:bg-orange-950/40"  },
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
  const current = STATUSES.find((s) => s.value === value) ?? STATUSES[0];

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition border border-transparent select-none",
            current.bg, current.text,
            disabled ? "cursor-default opacity-70" : "cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-slate-300/50"
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
          {current.label}
          {!disabled && (
            <svg
              className={cn("ml-0.5 h-3 w-3 opacity-60 transition-transform duration-200", open && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="bottom"
          sideOffset={5}
          avoidCollisions={true}
          collisionPadding={10}
          className="z-[9999] min-w-[150px] rounded-xl border border-slate-200 bg-white p-1 shadow-xl outline-none dark:border-slate-800 dark:bg-[#0F163D] animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <ul role="listbox" className="space-y-0.5">
            {STATUSES.map((s) => {
              const isSelected = s.value === value;
              return (
                <li
                  key={s.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(s.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    "hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
                    isSelected && "bg-slate-50 dark:bg-slate-800/60"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full flex-shrink-0", s.dot)} />
                  <span className={cn(s.text, isSelected && "font-bold")}>{s.label}</span>
                  {isSelected && (
                    <svg className="ml-auto h-3.5 w-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
