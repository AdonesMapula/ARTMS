import { useState, useEffect, useCallback, useRef } from "react";
import { FiBell, FiLogOut, FiUser, FiChevronDown, FiCalendar, FiClipboard, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";
import AnimatedThemeToggler from "./ui/animated-theme-toggler";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";

const ROLE_LABELS = {
  super_admin:     "Super Admin",
  hr_admin:        "Human Resources Admin",
  coo:             "Chief Operating Officer",
  department_head: "Department Head",
  employee:        "Employee",
};

const ICON_MAP = {
  application: { icon: <FiUser className="w-4 h-4" />,       tone: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900"    },
  interview:   { icon: <FiCalendar className="w-4 h-4" />,   tone: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-900" },
  request:     { icon: <FiClipboard className="w-4 h-4" />,  tone: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900"  },
  alert:       { icon: <FiAlertCircle className="w-4 h-4" />, tone: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900" },
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

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = async () => {
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
    <header className="sticky top-0 z-40 border-b border-[var(--artms-border)] bg-white/80 dark:bg-[#0B0F2E]/80 backdrop-blur transition-colors duration-200">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left — title */}
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[#111A62] dark:text-white transition-colors">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>

        {/* Right — theme toggler, bell, user menu */}
        <div className="flex items-center gap-2">
          {right}

          {/* ── MagicUI Animated Theme Toggler ───────────────────────────── */}
          <AnimatedThemeToggler />

          {/* ── Notification Bell + Panel Dropdown ───────────────────────── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none transition-colors"
              aria-label="Notifications"
            >
              <FiBell size={16} className="shrink-0" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-[3px] bg-rose-600 px-1 text-[10px] font-mono font-bold text-white shadow-2xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {notifOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotifOpen(false)}
                />

                <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden font-sans dark:border-slate-800 dark:bg-[#0F163D]">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="rounded-[3px] font-mono bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {unreadCount} unread
                          </span>
                        )}
                      </h3>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Panel Content Body */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingNotifs ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                        <p className="text-xs font-medium">Loading alerts...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-1.5">
                        <FiCheckCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-semibold">You're all caught up!</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">No new notifications.</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((item) => {
                        const meta = ICON_MAP[item.category] ?? ICON_MAP.alert;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleMarkAsRead(item.id, item.link)}
                            className={`group relative flex items-start gap-3 p-3 transition cursor-pointer ${
                              item.read
                                ? "bg-white hover:bg-slate-50 dark:bg-[#0F163D] dark:hover:bg-slate-850"
                                : "bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                            }`}
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${meta.tone}`}>
                              {meta.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <p className={`text-xs font-bold truncate ${item.read ? "text-slate-800 dark:text-slate-200" : "text-slate-900 dark:text-white"}`}>
                                  {item.title}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                            </div>
                            {!item.read && (
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer */}
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-900/80">
                    <Link
                      to={getNotifPageUrl()}
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
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
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-850"
            >
              {/* Avatar */}
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-6 w-6 rounded-md object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#111A62] text-[10px] font-bold text-white">
                  {initials}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate sm:block font-bold">{user?.name ?? "User"}</span>
              <FiChevronDown size={13} className="text-slate-400" />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

                <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#0F163D] overflow-hidden">
                  {/* User info */}
                  <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <span className="mt-1.5 inline-block rounded-[3px] border border-blue-200 bg-blue-50 dark:bg-blue-950/60 dark:border-blue-800 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                      {getRoleLabel(user?.role)}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5">
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FiUser size={14} /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <FiLogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        description="Are you sure you want to log out of your account?"
        confirmLabel="Yes, Log out"
        cancelLabel="No, Cancel"
        tone="danger"
        onConfirm={handleConfirmLogout}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}