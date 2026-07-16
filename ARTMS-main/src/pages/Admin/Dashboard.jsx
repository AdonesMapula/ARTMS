import { useEffect, useState } from "react";
import { FiActivity, FiCalendar, FiClipboard, FiUsers } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Skeleton from "../../components/ui/Skeleton";
import dashboardService from "../../services/dashboardService";

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    dashboardService.getAdminStats()
      .then(r => setStats(r.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error)   return <p className="p-6 text-red-500 text-sm">{error}</p>;

  const pipeline = stats.applicant_pipeline ?? {};
  const hires    = stats.monthly_hires ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Dashboard</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">HR Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Live recruitment statistics and requests.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Active Employees"   value={stats.total_employees}       icon={<FiUsers />} />
        <Stat title="Open Postings"      value={stats.open_job_postings}     icon={<FiClipboard />} />
        <Stat title="Applicants (month)" value={stats.total_applicants}      icon={<FiActivity />} />
        <Stat title="Interviews (month)" value={stats.interviews_this_month} icon={<FiCalendar />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Applicant pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Applicant Pipeline</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>Stage</TH>
                  <TH className="text-right">Count</TH>
                </tr>
              </THead>
              <tbody>
                {[
                  { label: "Applied",          key: "applied" },
                  { label: "AI Screening",     key: "ai_screening" },
                  { label: "Screening Passed", key: "screening_passed" },
                  { label: "Interview 1",      key: "interview_1" },
                  { label: "Interview 2",      key: "interview_2" },
                  { label: "Hired",            key: "hired" },
                  { label: "Rejected",         key: "rejected" },
                ].map(({ label, key }) => (
                  <tr key={key} className="hover:bg-slate-50">
                    <TD>{label}</TD>
                    <TD className="text-right font-bold text-slate-900">{pipeline[key] ?? 0}</TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="space-y-2 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Leaves</p>
              <p className="text-4xl font-extrabold text-slate-900">{stats.pending_leaves}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hired this month</p>
              <p className="text-4xl font-extrabold text-emerald-600">{stats.hired_this_month}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Manpower Requests</p>
              <p className="text-4xl font-extrabold text-amber-500">{stats.manpower_requests}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly hiring trend */}
      {hires.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Monthly Hiring Trend ({new Date().getFullYear()})</CardTitle></CardHeader>
          <CardContent>
            <SimpleBarChart
              items={hires.map(h => ({
                label: new Date(2024, h.month - 1).toLocaleString("default", { month: "short" }),
                value: h.count,
                color: "bg-blue-500",
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{value ?? 0}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-[var(--artms-primary)]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ items }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map(i => (
        <div key={i.label} className="grid grid-cols-12 items-center gap-3">
          <div className="col-span-2 text-xs font-semibold text-slate-600">{i.label}</div>
          <div className="col-span-9">
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div className={`h-2.5 rounded-full ${i.color}`} style={{ width: `${Math.round((i.value / max) * 100)}%` }} />
            </div>
          </div>
          <div className="col-span-1 text-right text-xs font-bold text-slate-700">{i.value}</div>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
