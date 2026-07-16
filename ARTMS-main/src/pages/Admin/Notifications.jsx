import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { mockNotifications } from "../../utils/mockData";

export default function AdminNotifications() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Alerts
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            System alerts and recruitment updates (UI only).
          </p>
        </div>
        <Badge tone="info">Placeholder</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {mockNotifications.map((n) => (
              <li key={n.id} className="rounded-2xl border border-[var(--artms-border)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                  </div>
                  <span className="text-xs text-slate-400">{n.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

