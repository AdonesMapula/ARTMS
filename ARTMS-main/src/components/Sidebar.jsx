import { NavLink, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { cn } from "../utils/cn";
import { useAuth } from "../context/AuthContext";
import artmsLogo from "../assets/Logo/LOGO_ARTMS_BLUE.png";

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
            {items.map((it) => (
              <li key={it.to}>
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
                    <span className="nav-icon text-base transition-colors">
                      {it.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  {it.badge && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {it.badge}
                    </span>
                  )}
                </NavLink>
              </li>
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
