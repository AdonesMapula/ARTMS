import { NavLink } from "react-router-dom";
import { cn } from "../utils/cn";

export default function Sidebar({ brand = "ARTMS", items = [] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 border-r border-[var(--artms-border)] bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--artms-primary-2)] text-sm font-black text-white">
              A
            </span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-slate-900">{brand}</p>
              <p className="text-xs text-slate-500">Enterprise Console</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      isActive
                        ? "bg-blue-50 text-[var(--artms-primary)]"
                        : "text-slate-700 hover:bg-slate-50"
                    )
                  }
                >
                  {it.icon ? <span className="text-base">{it.icon}</span> : null}
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  {it.badge ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {it.badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--artms-border)] px-5 py-4 text-xs text-slate-500">
          UI-only shell • ready for API integration
        </div>
      </div>
    </aside>
  );
}

