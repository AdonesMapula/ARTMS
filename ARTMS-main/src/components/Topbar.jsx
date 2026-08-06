import { useState, useEffect, useCallback, useRef } from "react";
import { FiBell, FiLogOut, FiUser, FiChevronDown, FiCalendar, FiClipboard, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import Button from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";

const ROLE_LABELS = {
  super_admin:     "Super Admin",
  hr_admin:        "HR Admin",
  coo:             "COO",
  department_head: "Department Head",
  employee:        "Employee",
};

const ICON_MAP = {
  application: { icon: <FiUser className="w-4 h-4" />,       tone: "bg-blue-50 text-blue-600 border-blue-200"    },
  interview:   { icon: <FiCalendar className="w-4 h-4" />,   tone: "bg-violet-50 text-violet-600 border-violet-200" },
  request:     { icon: <FiClipboard className="w-4 h-4" />,  tone: "bg-amber-50 text-amber-600 border-amber-200"  },
  alert:       { icon: <FiAlertCircle className="w-4 h-4" />, tone: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

const getRoleLabel = (role) =>
  ROLE_LABELS[role] ?? (role ? role.replace(/_/g, " ") : "");

export default function Topbar({ title, subtitle, right }) {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const { data } = await notificationService.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 8 seconds for real-time alert updates
    const interval = setInterval(fetchNotifications, 8000);

    const handleRefresh = () => fetchNotifications();
    window.addEventListener("artms-refresh-notifications", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("artms-refresh-notifications", handleRefresh);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setNotifOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const getNotifPageUrl = () => {
    if (user?.role === "coo") return "/coo/notifications";
    if (user?.role === "department_head") return "/department-head/notifications";
    return "/admin/notifications";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--artms-border)] bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left — title */}
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[#111A62]">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>

        {/* Right — bell, user menu */}
        <div className="flex items-center gap-2">
          {right}

          {/* ── Notification Bell + Panel Dropdown ───────────────────────── */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="outline"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center p-0"
              aria-label="Notifications"
            >
              <FiBell size={20} className="shrink-0 text-slate-700" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white shadow-md animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Notification Popover */}
            {notifOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotifOpen(false)}
                />

                <div className="absolute right-0 z-50 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {unreadCount} unread
                          </span>
                        )}
                      </h3>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Panel Content Body */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                    {loadingNotifs ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                        <p className="text-xs font-medium">Loading alerts...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                        <FiCheckCircle className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-semibold">You're all caught up!</p>
                        <p className="text-[11px] text-slate-400">No new notifications.</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((item) => {
                        const meta = ICON_MAP[item.category] ?? ICON_MAP.alert;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleMarkAsRead(item.id, item.link)}
                            className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer ${
                              item.read ? "bg-white hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50/70"
                            }`}
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${meta.tone}`}>
                              {meta.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <p className={`text-xs font-bold truncate ${item.read ? "text-slate-800" : "text-slate-900"}`}>
                                  {item.title}
                                </p>
                                <span className="text-[10px] font-medium text-slate-400 shrink-0">
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                            </div>
                            {!item.read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer */}
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
                    <Link
                      to={getNotifPageUrl()}
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                      View All Notifications →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

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
                    <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                      {getRoleLabel(user?.role)}
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