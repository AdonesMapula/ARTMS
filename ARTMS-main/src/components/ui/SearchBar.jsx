import { Search, X } from "lucide-react";
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
        "search-pulse-border group flex h-10 items-center gap-2 rounded-xl border border-[var(--artms-border)] bg-slate-50 px-3 transition-all duration-300",
        "hover:bg-white hover:border-slate-300 focus-within:bg-white focus-within:border-[#111A62]",
        className
      )}
    >
      <Search
        className="shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-[#111A62] group-focus-within:text-[#111A62]"
        size={16}
        aria-hidden="true"
      />
      <input
        className="h-full w-full min-w-0 appearance-none border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0"
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
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}