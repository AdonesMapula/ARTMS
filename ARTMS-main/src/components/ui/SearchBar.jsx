import { FiSearch } from "react-icons/fi";
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
        "flex h-11 items-center gap-2 rounded-lg border border-[var(--artms-border)] bg-white px-3",
        className
      )}
    >
      <FiSearch className="text-slate-400" aria-hidden="true" />
      <input
        className="h-full w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

