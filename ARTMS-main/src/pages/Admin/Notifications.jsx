import { useEffect, useState } from "react";
import { FiBell, FiUser, FiCalendar, FiClipboard, FiAlertCircle, FiCheck, FiCheckCircle } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import notificationService from "../../services/notificationService";

const ICON_MAP = {
  application: { icon: <FiUser />,       tone: "bg-blue-50 text-blue-600 border-blue-200"    },
  interview:   { icon: <FiCalendar />,   tone: "bg-violet-50 text-violet-600 border-violet-200" },
  request:     { icon: <FiClipboard />,  tone: "bg-amber-50 text-amber-600 border-amber-200"  },
  alert:       { icon: <FiAlertCircle />, tone: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

export default function AdminNotifications() {
  const [filter, setFilter]               = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await notificationService.getAll();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const visible = notifications.filter(n => filter === "all" || (filter === "unread" && !n.read));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Alerts & System Activity</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
            >
              <FiCheck className="w-3.5 h-3.5" /> Mark all as read
            </button>
          )}
          {["all", "unread"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize border transition ${
                filter === f ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBell className="text-slate-400" />
              <CardTitle>System Notifications</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-xs font-semibold">Fetching system notifications...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <FiCheckCircle className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold">No notifications found.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {visible.map(n => {
                const meta = ICON_MAP[n.category] ?? ICON_MAP.alert;
                return (
                  <li
                    key={n.id}
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                    className={`flex items-start gap-3.5 rounded-2xl border p-4 transition ${
                      n.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/50 shadow-sm"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg border ${meta.tone}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-extrabold ${n.read ? "text-slate-800" : "text-slate-900"}`}>{n.title}</p>
                        {!n.read && <Badge tone="info">Unread</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                      <p className="mt-1.5 text-[11px] font-medium text-slate-400">{n.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
