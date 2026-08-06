import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
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
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const THIS_YEAR = new Date().getFullYear();
const MIN_YEAR = 1930;

/**
 * BirthDatePicker — Calendar for Date of Birth.
 * - Disables future dates (can only pick today or earlier)
 * - Tap the month/year header to open a Year + Month selector panel
 * - Same polished UI as DatePicker
 *
 * Props:
 *   value       — ISO date string "YYYY-MM-DD"
 *   onChange    — (isoString) => void
 *   placeholder — string
 *   className   — wrapper class
 */
export default function BirthDatePicker({
  value,
  onChange,
  placeholder = "Select date of birth",
  className,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = parseLocalDate(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : THIS_YEAR - 25);
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : 0);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState(null);
  const [panel, setPanel] = useState("calendar"); // "calendar" | "year-month"

  const containerRef = useRef(null);
  const yearListRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Scroll the year list so the active year is visible
  useEffect(() => {
    if (panel === "year-month" && yearListRef.current) {
      const active = yearListRef.current.querySelector("[data-active='true']");
      if (active) active.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [panel]);

  const navigate = (dir) => {
    if (animating) return;
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      if (dir === "prev") {
        setViewMonth((m) => {
          if (m === 0) { setViewYear((y) => y - 1); return 11; }
          return m - 1;
        });
      } else {
        setViewMonth((m) => {
          if (m === 11) { setViewYear((y) => y + 1); return 0; }
          return m + 1;
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
    if (clicked > today) return; // no future
    onChange?.(toLocalIso(clicked));
    setOpen(false);
  };

  const handleClear = (e) => { e.stopPropagation(); onChange?.(""); };

  // Build calendar cells
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day) => {
    if (!day) return false;
    return new Date(viewYear, viewMonth, day).getTime() === today.getTime();
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

  const isFuture = (day) => {
    if (!day) return false;
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d > today;
  };

  // Year list from current year down to MIN_YEAR
  const years = [];
  for (let y = THIS_YEAR; y >= MIN_YEAR; y--) years.push(y);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((p) => !p); setPanel("calendar"); }}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-2xs transition-all duration-200 outline-none cursor-pointer select-none",
          "hover:border-[#111A62] hover:bg-slate-50/60",
          open ? "border-[#111A62] ring-2 ring-[#111A62]/20 bg-slate-50/50" : ""
        )}
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays
            size={16}
            className={cn("shrink-0 transition-colors duration-200", open || value ? "text-[#111A62]" : "text-slate-400")}
          />
          <span className={cn("font-medium transition-colors", value ? "text-slate-900" : "text-slate-400 font-normal")}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={0}
              title="Clear"
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          <ChevronRight
            size={14}
            className={cn("text-slate-400 transition-transform duration-200", open ? "rotate-90 text-[#111A62]" : "")}
          />
        </div>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[304px] select-none rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 overflow-hidden"
          style={{ animation: "bdpFadeIn 150ms cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          {/* ── Calendar panel ── */}
          {panel === "calendar" && (
            <>
              {/* Header — click to open year/month picker */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate("prev")}
                  disabled={animating || (viewYear <= MIN_YEAR && viewMonth === 0)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setPanel("year-month")}
                  className="group flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                  <div className="text-center leading-tight">
                    <p className="text-sm font-extrabold text-slate-900 tracking-tight">{MONTHS_FULL[viewMonth]}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{viewYear}</p>
                  </div>
                  <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-600 transition-colors mt-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("next")}
                  disabled={animating || (viewYear >= THIS_YEAR && viewMonth >= today.getMonth())}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 px-3 pt-3">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="flex items-center justify-center pb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{d}</span>
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div
                className="grid grid-cols-7 px-3 pb-3 gap-y-0.5"
                style={{
                  opacity: animating ? 0 : 1,
                  transform: animating ? `translateX(${slideDir === "prev" ? "-6px" : "6px"})` : "translateX(0)",
                  transition: "opacity 140ms ease, transform 140ms ease",
                }}
              >
                {cells.map((day, i) => {
                  const sel = isSelected(day);
                  const tod = isToday(day);
                  const fut = isFuture(day);

                  return (
                    <div key={i} className="flex items-center justify-center">
                      {day !== null ? (
                        <button
                          type="button"
                          onClick={() => !fut && handleDayClick(day)}
                          disabled={fut}
                          className={cn(
                            "relative h-9 w-9 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                            sel
                              ? "bg-[#111A62] text-white font-bold shadow-md"
                              : tod
                              ? "text-[#111A62] font-bold bg-[#111A62]/8 hover:bg-[#111A62]/15"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                            fut ? "opacity-20 cursor-not-allowed hover:bg-transparent hover:text-slate-700" : "",
                            !sel && !fut ? "active:scale-95" : ""
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
                <span className="text-xs text-slate-400 italic">Past dates only</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* ── Year + Month selector panel ── */}
          {panel === "year-month" && (
            <div style={{ animation: "bdpFadeIn 120ms ease forwards" }}>
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
                <p className="text-sm font-extrabold text-slate-900 tracking-tight">Select Year & Month</p>
                <button
                  type="button"
                  onClick={() => setPanel("calendar")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex" style={{ height: 268 }}>
                {/* Year list */}
                <div
                  ref={yearListRef}
                  className="w-1/2 overflow-y-auto border-r border-slate-100 py-2 scrollbar-thin scrollbar-thumb-slate-200"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {years.map((y) => {
                    const active = y === viewYear;
                    const disabled = y > THIS_YEAR;
                    return (
                      <button
                        key={y}
                        type="button"
                        data-active={active}
                        disabled={disabled}
                        onClick={() => {
                          setViewYear(y);
                          // clamp month if viewing future
                          if (y === THIS_YEAR && viewMonth > today.getMonth()) {
                            setViewMonth(today.getMonth());
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-center py-2 text-sm font-semibold transition-colors cursor-pointer",
                          active
                            ? "bg-[#111A62] text-white"
                            : "text-slate-700 hover:bg-slate-100",
                          disabled ? "opacity-30 cursor-not-allowed" : ""
                        )}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>

                {/* Month list */}
                <div className="w-1/2 overflow-y-auto py-2" style={{ scrollbarWidth: "thin" }}>
                  {MONTHS_SHORT.map((m, idx) => {
                    const active = idx === viewMonth;
                    // disable future months in current year
                    const disabled = viewYear === THIS_YEAR && idx > today.getMonth();
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!disabled) setViewMonth(idx);
                        }}
                        className={cn(
                          "flex w-full items-center justify-center py-2 text-sm font-semibold transition-colors cursor-pointer",
                          active
                            ? "bg-[#111A62] text-white"
                            : "text-slate-700 hover:bg-slate-100",
                          disabled ? "opacity-30 cursor-not-allowed" : ""
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirm button */}
              <div className="border-t border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPanel("calendar")}
                  className="w-full rounded-xl bg-[#111A62] py-2 text-sm font-bold text-white shadow-sm hover:bg-[#0d1449] transition-colors cursor-pointer"
                >
                  Done — {MONTHS_FULL[viewMonth]} {viewYear}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bdpFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
