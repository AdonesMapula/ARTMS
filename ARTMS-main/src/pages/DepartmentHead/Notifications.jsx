import { useEffect, useState } from "react";
import { FiBell, FiCheckCircle } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import notificationService from "../../services/notificationService";

export default function DepartmentHeadNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = () => {
    notificationService
      .getAll()
      .then(({ data }) => setNotifications(data.notifications || []))
      .catch((err) => console.warn("Failed to load notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 font-sans">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Department Updates
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Alerts for PRF approvals, status updates, and hiring activities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiBell className="text-slate-400" />
              <CardTitle>Notifications History</CardTitle>
            </div>
            <Badge tone="info">{notifications.filter(n => !n.read).length} Unread</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
              <p className="text-xs font-medium">Loading department alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <FiCheckCircle className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">No notifications available.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-2xl border p-4 transition ${
                    n.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{n.title}</p>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 shrink-0">{n.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
