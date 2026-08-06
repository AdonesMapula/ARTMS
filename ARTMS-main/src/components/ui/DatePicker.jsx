import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { cn } from "../../utils/cn";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toLocalIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(str) {
  const d = parseLocalDate(str);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * DatePicker — Clean interactive calendar popover.
 *
 * Props:
 *   value       — ISO date string "YYYY-MM-DD"
 *   onChange    — (isoString) => void
 *   placeholder — string
 *   minDate     — ISO date string (optional)
 *   disablePast — boolean: if true, dates before today are disabled
 *   className   — wrapper class
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  minDate,
  disablePast = false,
  className,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = parseLocalDate(value);
  const minD = parseLocalDate(minDate);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selected ? selected.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? selected.getMonth() : today.getMonth()
  );
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = (dir) => {
    if (animating) return;
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      if (dir === "prev") {
        setViewMonth((prev) => {
          if (prev === 0) { setViewYear((y) => y - 1); return 11; }
          return prev - 1;
        });
      } else {
        setViewMonth((prev) => {
          if (prev === 11) { setViewYear((y) => y + 1); return 0; }
          return prev + 1;
        });
      }
      setAnimating(false);
      setSlideDir(null);
    }, 160);
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const handleDayClick = (day) => {
    const clicked = new Date(viewYear, viewMonth, day);
    clicked.setHours(0, 0, 0, 0);
    if (minD && clicked < minD) return;
    onChange?.(toLocalIso(clicked));
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day) => {
    if (!day) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d.getTime() === today.getTime();
  };

  const isSelected = (day) => {
    if (!day || !selected) return false;
    const d = new Date(viewYear, viewMonth, day);
    return (
      d.getFullYear() === selected.getFullYear() &&
      d.getMonth() === selected.getMonth() &&
      d.getDate() === selected.getDate()
    );
  };

  const isDisabled = (day) => {
    if (!day) return false;
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (disablePast && d < today) return true;
    if (minD && d < minD) return true;
    return false;
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-2xs transition-all duration-200 outline-none cursor-pointer select-none",
          "hover:border-[#111A62] hover:bg-slate-50/60",
          open ? "border-[#111A62] ring-2 ring-[#111A62]/20 bg-slate-50/50" : ""
        )}
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays
            size={16}
            className={cn(
              "shrink-0 transition-colors duration-200",
              open || value ? "text-[#111A62]" : "text-slate-400"
            )}
          />
          <span
            className={cn(
              "font-medium transition-colors",
              value ? "text-slate-900" : "text-slate-400 font-normal"
            )}
          >
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={0}
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
              title="Clear date"
            >
              <X size={12} />
            </span>
          )}
          <ChevronRight
            size={14}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              open ? "rotate-90 text-[#111A62]" : ""
            )}
          />
        </div>
      </button>

      {/* Calendar Popover */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[304px] select-none rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 overflow-hidden"
          style={{ animation: "dpFadeIn 150ms cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => navigate("prev")}
              disabled={animating}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center leading-tight">
              <p className="text-sm font-extrabold text-slate-900 tracking-tight">
                {MONTHS[viewMonth]}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{viewYear}</p>
            </div>

            <button
              type="button"
              onClick={() => navigate("next")}
              disabled={animating}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="flex items-center justify-center pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {d}
                </span>
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div
            className="grid grid-cols-7 px-3 pb-3 gap-y-0.5"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating
                ? `translateX(${slideDir === "prev" ? "-6px" : "6px"})`
                : "translateX(0)",
              transition: "opacity 140ms ease, transform 140ms ease",
            }}
          >
            {cells.map((day, i) => {
              const sel = isSelected(day);
              const tod = isToday(day);
              const dis = isDisabled(day);

              return (
                <div key={i} className="flex items-center justify-center">
                  {day !== null ? (
                    <button
                      type="button"
                      onClick={() => !dis && handleDayClick(day)}
                      disabled={dis}
                      className={cn(
                        "relative h-9 w-9 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                        sel
                          ? "bg-[#111A62] text-white font-bold shadow-md"
                          : tod
                          ? "text-[#111A62] font-bold bg-[#111A62]/8 hover:bg-[#111A62]/15"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                        dis
                          ? "opacity-25 cursor-not-allowed hover:bg-transparent hover:text-slate-700"
                          : "",
                        !sel && !dis ? "active:scale-95" : ""
                      )}
                    >
                      {day}
                      {tod && !sel && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#111A62]" />
                      )}
                    </button>
                  ) : (
                    <span className="h-9 w-9" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                onChange?.(toLocalIso(today));
                setOpen(false);
              }}
              className="text-xs font-semibold text-[#111A62] hover:text-[#0d1449] transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dpFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
