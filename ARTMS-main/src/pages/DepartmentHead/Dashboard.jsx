import { useEffect, useState } from "react";
import { FiClock, FiClipboard, FiTrendingUp, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import dashboardService from "../../services/dashboardService";

export default function DepartmentHeadDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    dashboardService.getDepartmentHeadStats()
      .then(r => setStats(r.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    </div>
  );
  if (error) return <p className="p-6 text-red-500 text-sm">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Overview</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Department Head Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Submit manpower requests and monitor your department.</p>
        </div>
        <Button as={Link} to="/department-head/manpower-request" variant="accent">
          <FiClipboard aria-hidden="true" /> New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Employees"   value={stats.department_employees} icon={<FiUsers />}     color="bg-blue-50  text-blue-700" />
        <StatCard title="Pending Requests"   value={stats.pending_requests}     icon={<FiClock />}     color="bg-amber-50 text-amber-700" />
        <StatCard title="Open Postings"      value={stats.open_postings}        icon={<FiTrendingUp />} color="bg-green-50 text-green-700" />
        <StatCard title="Pending Leaves"     value={stats.pending_leaves}       icon={<FiClipboard />} color="bg-red-50   text-red-700" />
      </div>

      {/* Attendance today */}
      <Card>
        <CardHeader><CardTitle>Today's Attendance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-extrabold text-slate-900">{stats.attendance_today}</div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Records logged today</p>
              <p className="text-xs text-slate-400">
                {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button as={Link} to="/department-head/manpower-request" variant="outline" className="w-full justify-start">
              <FiClipboard /> Submit Manpower Request
            </Button>
            <Button as={Link} to="/department-head/request-history" variant="outline" className="w-full justify-start">
              <FiTrendingUp /> View Request History
            </Button>
            <Button as={Link} to="/department-head/notifications" variant="outline" className="w-full justify-start">
              <FiClock /> Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
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
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${color}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}
