import { FiBell, FiSearch } from "react-icons/fi";
import Button from "./ui/Button";

export default function Topbar({ title, subtitle, right }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--artms-border)] bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {title}
          </p>
          {subtitle ? (
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <div className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--artms-border)] bg-white px-3 text-sm text-slate-600 md:flex">
            <FiSearch className="text-slate-400" aria-hidden="true" />
            <span className="text-slate-400">Search…</span>
          </div>
          <Button variant="outline" className="h-10 w-10 p-0" aria-label="Notifications">
            <FiBell aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}

