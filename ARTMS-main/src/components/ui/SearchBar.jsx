import { FiSearch, FiX } from "react-icons/fi";
import { cn } from "../../utils/cn";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
}) {
  return (
    <div
      className={cn(
        "group flex h-11 items-center gap-2.5 rounded-xl border border-[var(--artms-border)] bg-slate-50 px-3.5 transition-all duration-200",
        "focus-within:border-[#111A62] focus-within:bg-white focus-within:shadow-sm",
        className
      )}
    >
      <FiSearch
        className="shrink-0 text-slate-400 transition-colors duration-200 group-focus-within:text-[#111A62]"
        size={18}
        aria-hidden="true"
      />
      <input
        className="h-full w-full min-w-0 appearance-none border-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none sm:text-sm"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        inputMode="search"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          aria-label="Clear search"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600"
        >
          <FiX size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}