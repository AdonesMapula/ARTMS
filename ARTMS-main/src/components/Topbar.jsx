import { useState } from "react";
import { FiBell, FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, subtitle, right }) {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--artms-border)] bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left — title */}
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>

        {/* Right — bell, user menu */}
        <div className="flex items-center gap-2">
          {right}

          <Button
            variant="outline"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center p-0"
            aria-label="Notifications"
          >
            <FiBell size={20} className="shrink-0" aria-hidden="true" />
          </Button>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-[var(--artms-border)] bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none"
            >
              {/* Avatar */}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--artms-primary)] text-xs font-bold text-white">
                {initials}
              </span>
              <span className="hidden max-w-[120px] truncate sm:block">{user?.name ?? "User"}</span>
              <FiChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[var(--artms-border)] bg-white shadow-xl">
                  {/* User info */}
                  <div className="border-b border-[var(--artms-border)] px-4 py-3">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold capitalize text-blue-700">
                      {user?.role?.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FiUser size={15} /> My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}