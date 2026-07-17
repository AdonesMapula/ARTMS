import { useEffect, useState } from "react";
import { FiCheckCircle, FiClock, FiClipboard, FiXCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import manpowerService from "../../services/manpowerService";

const URGENCY_TONE = { low: "default", medium: "info", high: "warning", critical: "danger" };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

export default function CooDashboard() {
  const { user } = useAuth();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    manpowerService
      .getAll({ per_page: 100 })
      .then((res) => setRows(res.data?.data ?? []))
      .catch(() => setError("Failed to load requests."))
      .finally(() => setLoading(false));
  }, []);

  const pending  = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;
  const total    = rows.length;

  // 5 most recent pending
  const recentPending = rows
    .filter((r) => r.status === "pending")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {user?.name?.split(" ")[0] ?? "COO"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve Personnel Requisition Forms submitted by department heads.
          </p>
        </div>
        <Link
          to="/coo/prf-approvals"
          className="inline-flex items-center gap-2 rounded-xl bg-[#111A62] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d1550]"
        >
          <FiClipboard aria-hidden="true" />
          View All PRFs
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={total}
            icon={<FiClipboard />}
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            title="Pending Approval"
            value={pending}
            icon={<FiClock />}
            color="bg-amber-50 text-amber-700"
          />
          <StatCard
            title="Approved"
            value={approved}
            icon={<FiCheckCircle />}
            color="bg-green-50 text-green-700"
          />
          <StatCard
            title="Rejected"
            value={rejected}
            icon={<FiXCircle />}
            color="bg-red-50 text-red-700"
          />
        </div>
      )}

      {/* Recent pending PRFs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>
              Pending PRFs
              {pending > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {pending}
                </span>
              )}
            </CardTitle>
            <Link
              to="/coo/prf-approvals"
              className="text-xs font-semibold text-[#111A62] hover:underline"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {!loading && recentPending.length === 0 && (
            <div className="py-12 text-center">
              <FiCheckCircle className="mx-auto mb-3 text-3xl text-green-400" />
              <p className="text-sm font-semibold text-slate-600">All caught up!</p>
              <p className="mt-1 text-xs text-slate-400">No pending PRFs require your action.</p>
            </div>
          )}

          {!loading && recentPending.length > 0 && (
            <ul className="space-y-3">
              {recentPending.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {r.position_needed}
                      </span>
                      <Badge tone={URGENCY_TONE[r.urgency] ?? "default"}>
                        {cap(r.urgency)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {r.department?.department_name ?? "—"} · Headcount: {r.headcount} · Needed by {fmt(r.needed_by)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Submitted {fmt(r.created_at)}
                    </p>
                  </div>
                  <Link
                    to="/coo/prf-approvals"
                    className="shrink-0 rounded-lg border border-[#111A62] px-3 py-1.5 text-xs font-semibold text-[#111A62] transition hover:bg-[#111A62] hover:text-white"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{value ?? 0}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${color}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
