import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { cn } from "../utils/cn";
import { useAuth } from "../context/AuthContext";
import artmsLogo from "../assets/Logo/LOGO_ARTMS_BLUE.png";

/**
 * NavItem renders either:
 *   - a plain NavLink  (no `children` array)
 *   - a collapsible group with child NavLinks  (has `children` array)
 *
 * Item shape:
 *   { label, to, icon?, end?, badge? }          — plain link
 *   { label, icon?, badge?, children: [...] }   — group (no `to`)
 */
function NavItem({ it }) {
  const location = useLocation();

  // A group item has children but no `to`
  if (it.children?.length) {
    // Auto-expand when any child is active
    const anyChildActive = it.children.some((c) =>
      location.pathname.startsWith(c.to)
    );
    const [open, setOpen] = useState(anyChildActive);

    return (
      <li>
        {/* Group header — not a link, just a toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            anyChildActive
              ? "bg-[#111A62]/10 text-[#111A62] [&_.nav-icon]:text-[#111A62]"
              : "text-slate-700 hover:bg-[#E2E8F0] hover:text-slate-900 [&_.nav-icon]:text-[#4D569E]"
          )}
        >
          {it.icon && (
            <span className="nav-icon text-base transition-colors">{it.icon}</span>
          )}
          <span className="min-w-0 flex-1 truncate text-left">{it.label}</span>
          {it.badge && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              {it.badge}
            </span>
          )}
          <span className="text-slate-400">
            {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </span>
        </button>

        {/* Children — indented */}
        {open && (
          <ul className="mt-0.5 space-y-0.5 pl-4">
            {it.children.map((child) => (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  end={child.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition group",
                      isActive
                        ? "bg-[#111A62] text-white [&_.nav-icon]:text-white"
                        : "text-slate-600 hover:bg-[#E2E8F0] hover:text-slate-900 [&_.nav-icon]:text-[#4D569E]"
                    )
                  }
                >
                  {child.icon && (
                    <span className="nav-icon text-sm transition-colors">{child.icon}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{child.label}</span>
                  {child.badge && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {child.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Plain link item
  return (
    <li>
      <NavLink
        to={it.to}
        end={it.end}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition group",
            isActive
              ? "bg-[#111A62] text-white [&_.nav-icon]:text-white"
              : "text-slate-700 hover:bg-[#E2E8F0] hover:text-slate-900 [&_.nav-icon]:text-[#4D569E] hover:[&_.nav-icon]:text-[#4D569E]"
          )
        }
      >
        {it.icon && (
          <span className="nav-icon text-base transition-colors">{it.icon}</span>
        )}
        <span className="min-w-0 flex-1 truncate">{it.label}</span>
        {it.badge && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {it.badge}
          </span>
        )}
      </NavLink>
    </li>
  );
}

export default function Sidebar({ brand = "ARTMS", items = [] }) {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-[var(--artms-border)] bg-[#F3F0F1] lg:flex">
      <div className="flex h-full flex-col">

        {/* Brand */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-2">
            <img
              src={artmsLogo}
              alt="ARTMS Logo"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-[#111A62]">{brand}</p>
              <p className="text-xs text-slate-500">AI Recruitment Management System</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {items.map((it, idx) => (
              <NavItem key={it.to ?? `group-${idx}`} it={it} />
            ))}
          </ul>
        </nav>

        {/* User info + logout */}
        <div className="border-t border-[var(--artms-border)] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--artms-primary)] text-sm font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-slate-900">{user?.name ?? "User"}</p>
              <p className="truncate text-xs capitalize text-slate-500">
                {user?.role?.replace(/_/g, " ") ?? ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Sign out"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
