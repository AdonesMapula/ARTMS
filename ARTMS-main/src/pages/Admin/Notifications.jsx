import { useState } from "react";
import { FiBell, FiUser, FiCalendar, FiClipboard, FiAlertCircle } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { mockNotifications } from "../../utils/mockData";

const ICON_MAP = {
  application: { icon: <FiUser />,       tone: "bg-blue-50 text-blue-600"    },
  interview:   { icon: <FiCalendar />,   tone: "bg-violet-50 text-violet-600" },
  request:     { icon: <FiClipboard />,  tone: "bg-amber-50 text-amber-600"  },
  alert:       { icon: <FiAlertCircle />, tone: "bg-red-50 text-red-600"     },
};

// Augment mock with categories
const NOTIFICATIONS = mockNotifications.map((n, i) => ({
  ...n,
  category: ["application", "interview", "request", "alert"][i % 4],
  read: i > 1,
}));

export default function AdminNotifications() {
  const [filter, setFilter] = useState("all");

  const visible = NOTIFICATIONS.filter(n => filter === "all" || (filter === "unread" && !n.read));

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Alerts</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {NOTIFICATIONS.filter(n => !n.read).length} unread notification{NOTIFICATIONS.filter(n => !n.read).length !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          {["all", "unread"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize border transition ${
                filter === f ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FiBell className="text-slate-400" />
            <CardTitle>All Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No notifications.</p>
          ) : (
            <ul className="space-y-2">
              {visible.map(n => {
                const meta = ICON_MAP[n.category] ?? ICON_MAP.alert;
                return (
                  <li key={n.id} className={`flex items-start gap-3 rounded-2xl border p-4 transition ${n.read ? "border-[var(--artms-border)] bg-white" : "border-blue-100 bg-blue-50"}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${meta.tone}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                        {!n.read && <Badge tone="info">New</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{n.time}</p>
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
