import { useEffect, useState } from "react";
import { FiBell, FiCheckCircle, FiXCircle, FiClipboard } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import manpowerService from "../../services/manpowerService";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        year:  "numeric",
        month: "short",
        day:   "numeric",
        hour:  "2-digit",
        minute:"2-digit",
      })
    : "—";

// Build notifications from real manpower request data
function buildNotifications(rows) {
  return rows
    .filter((r) => r.status !== "pending")
    .map((r) => ({
      id:      r.id,
      status:  r.status,
      title:
        r.status === "approved"
          ? `PRF #${r.id} Approved`
          : r.status === "rejected"
          ? `PRF #${r.id} Rejected`
          : `PRF #${r.id} ${r.status}`,
      message: `"${r.position_needed}" — ${r.department?.department_name ?? "Unknown Dept"} · Headcount: ${r.headcount}`,
      remarks: r.approval_remarks ?? null,
      time:    r.approved_at ?? r.updated_at,
    }))
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

const FILTERS = ["All", "Approved", "Rejected"];

export default function CooNotifications() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("All");

  useEffect(() => {
    manpowerService
      .getAll({ per_page: 100 })
      .then((res) => setRows(res.data?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const notifications = buildNotifications(rows);
  const visible = notifications.filter(
    (n) => filter === "All" || n.status === filter.toLowerCase()
  );

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Alerts
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A log of all PRF actions you have taken.
          </p>
        </div>
        {/* Filter pills */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "rounded-full px-4 py-1.5 text-xs font-bold border transition",
                filter === f
                  ? "bg-[#111A62] text-white border-[#111A62]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-[#E2E8F0]",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FiBell className="text-slate-400" aria-hidden="true" />
            <CardTitle>Activity Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <FiBell className="mx-auto mb-3 text-3xl text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No notifications yet.</p>
              <p className="mt-1 text-xs text-slate-400">
                Approved or rejected PRFs will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                >
                  {/* Icon */}
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base",
                      n.status === "approved"
                        ? "bg-green-50 text-green-600"
                        : n.status === "rejected"
                        ? "bg-red-50 text-red-500"
                        : "bg-blue-50 text-blue-600",
                    ].join(" ")}
                  >
                    {n.status === "approved" ? (
                      <FiCheckCircle aria-hidden="true" />
                    ) : n.status === "rejected" ? (
                      <FiXCircle aria-hidden="true" />
                    ) : (
                      <FiClipboard aria-hidden="true" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{n.title}</p>
                      <Badge
                        tone={
                          n.status === "approved"
                            ? "success"
                            : n.status === "rejected"
                            ? "danger"
                            : "info"
                        }
                      >
                        {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                    {n.remarks && (
                      <p className="mt-1 text-xs text-slate-400 italic">
                        Remarks: {n.remarks}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">{fmt(n.time)}</p>
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
