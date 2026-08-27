import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  FiClock, FiClipboard, FiTrendingUp, FiUsers, FiBell, FiPlusCircle, 
  FiCheckCircle, FiActivity, FiLayers, FiBarChart2 
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import dashboardService from "../../services/dashboardService";
import { cn } from "../../utils/cn";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";

export default function DepartmentHeadDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    dashboardService.getDepartmentHeadStats()
      .then(r => setStats(r.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return (
    <div className="space-y-6 p-2 animate-pulse">
      <Skeleton className="h-16 w-80 rounded-2xl bg-slate-200/80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-96 lg:col-span-8 rounded-3xl" />
        <Skeleton className="h-96 lg:col-span-4 rounded-3xl" />
      </div>
    </div>
  );
  if (error) return <p className="p-6 text-red-500 font-bold bg-red-50 rounded-2xl border border-red-200">{error}</p>;

  // Values
  const deptEmployees = stats?.department_employees ?? 0;
  const pendingRequests = stats?.pending_requests ?? 0;
  const openPostings = stats?.open_postings ?? 0;
  const pendingLeaves = stats?.pending_leaves ?? 0;
  const attendanceToday = stats?.attendance_today ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="relative">
          <div className="absolute -left-4 -top-4 -z-10 h-16 w-16 rounded-full bg-blue-100/50 blur-xl"></div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)] flex items-center gap-2">
            <FiLayers /> Department Overview
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Head Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Submit manpower requests and monitor your team's daily metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm cursor-pointer shrink-0"
          >
            <FiActivity className={cn(refreshing && "animate-spin text-[#E15B1D]")} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
          <Button as={Link} to="/department-head/manpower-request" variant="accent" className="rounded-xl shadow-md shrink-0">
            <FiPlusCircle size={16} /> New Request
          </Button>
        </div>
      </div>

      {/* ── KPI GRID ──────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPIBox
          title="Active Employees"
          value={deptEmployees}
          icon={<FiUsers size={22} />}
          accentColor="navy"
          subtitle="Total department headcount"
        />
        <KPIBox
          title="Pending Requests"
          value={pendingRequests}
          trend={pendingRequests > 0 ? "Action Required" : "All Clear"}
          trendPositive={pendingRequests === 0}
          icon={<FiClock size={22} />}
          accentColor="orange"
          subtitle="Awaiting approvals"
        />
        <KPIBox
          title="Open Postings"
          value={openPostings}
          icon={<FiTrendingUp size={22} />}
          accentColor="teal"
          subtitle="Active job postings"
        />
        <KPIBox
          title="Pending Leaves"
          value={pendingLeaves}
          trend={pendingLeaves > 0 ? "Review Needed" : "Up to date"}
          trendPositive={pendingLeaves === 0}
          icon={<FiClipboard size={22} />}
          accentColor="indigo"
          subtitle="Leave applications"
        />
      </div>

      {/* ── MIDDLE TIER (CHART & QUICK ACTIONS) ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        {/* CHART SECTON */}
        <div className="lg:col-span-8 flex flex-col">
          <DepartmentActivityChart weeklyActivity={stats?.weekly_activity} />
        </div>

        {/* QUICK ACTIONS & ATTENDANCE */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl shadow-slate-900/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <FiCheckCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Today's Attendance</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-slate-900">{attendanceToday}</span>
              <span className="text-sm font-bold text-slate-500">/ {deptEmployees} Logged In</span>
            </div>
            <div className="mt-5 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                style={{ width: `${deptEmployees > 0 ? Math.min((attendanceToday / deptEmployees) * 100, 100) : 0}%` }}
              />
            </div>
          </Card>

          <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <h3 className="mb-5 text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FiActivity size={14} /> Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <Link to="/department-head/manpower-request" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:bg-[#111A62] hover:border-[#111A62] hover:text-white transition-all duration-300 hover:shadow-md cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 group-hover:text-[#111A62] shadow-sm transition-colors">
                    <FiPlusCircle size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors">Submit PRF</span>
                </div>
              </Link>
              <Link to="/department-head/request-history" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:bg-[#E15B1D] hover:border-[#E15B1D] hover:text-white transition-all duration-300 hover:shadow-md cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 group-hover:text-[#E15B1D] shadow-sm transition-colors">
                    <FiTrendingUp size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors">View Request History</span>
                </div>
              </Link>
              <Link to="/department-head/notifications" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:bg-teal-600 hover:border-teal-600 hover:text-white transition-all duration-300 hover:shadow-md cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 group-hover:text-teal-600 shadow-sm transition-colors">
                    <FiBell size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors">Alerts & Notifications</span>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── KPI BOX ──────────────────────────────────────────────────────────────────
function KPIBox({ title, value, subtitle, trend, trendPositive, icon, accentColor }) {
  const colorMap = {
    navy: { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-600 dark:text-emerald-400" },
    purple: { bg: "bg-purple-100 dark:bg-purple-950/60", text: "text-purple-600 dark:text-purple-400" },
    orange: { bg: "bg-orange-100 dark:bg-orange-950/60", text: "text-orange-600 dark:text-orange-400" },
    indigo: { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-600 dark:text-indigo-400" },
    teal: { bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-600 dark:text-teal-400" },
    amber: { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-600 dark:text-amber-400" },
    rose: { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-600 dark:text-rose-400" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <div className="group relative rounded-xl h-full p-[1.5px] transition-all duration-300 bg-slate-200 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-[#111A62] hover:to-[#E15B1D] hover:shadow-lg hover:shadow-[#111A62]/10">
      <Card className="h-full rounded-[10px] border-0 bg-white dark:bg-[#0F163D] flex flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black tracking-tight text-[#111A62]">{value}</p>
              {trend && (
                <span className={cn(
                  "inline-flex items-center text-[10px] font-extrabold rounded-full px-2 py-0.5",
                  trendPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-amber-50 text-amber-700 border border-amber-200/60"
                )}>
                  {trend}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs font-semibold text-slate-400 pt-1">{subtitle}</p>}
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${theme.bg}`}>
            <div className={theme.text}>
              {icon}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── WEEKLY ACTIVITY CHART COMPONENT ──────────────────────────────────────────
const chartConfig = {
  present: { label: "Present", color: "#111A62" },
  onLeave: { label: "On Leave", color: "#E15B1D" },
};

function DepartmentActivityChart({ weeklyActivity }) {
  const data = weeklyActivity || [
    { day: "Mon", present: 85, onLeave: 5 },
    { day: "Tue", present: 90, onLeave: 2 },
    { day: "Wed", present: 88, onLeave: 4 },
    { day: "Thu", present: 92, onLeave: 1 },
    { day: "Fri", present: 75, onLeave: 10 },
    { day: "Sat", present: 30, onLeave: 0 },
    { day: "Sun", present: 20, onLeave: 0 },
  ];

  return (
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col min-h-[380px]">
      <div className="flex items-start sm:items-center justify-between mb-8 flex-col sm:flex-row gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiBarChart2 size={18} className="text-[#111A62]" />
            <h3 className="text-base font-extrabold text-slate-900">Weekly Department Activity</h3>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">Live attendance & leave trends for the week</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-[#111A62]"></span> Present</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-[#E15B1D]"></span> On Leave</div>
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
              <Bar dataKey="onLeave" name="On Leave" stackId="a" fill="#E15B1D" radius={[0, 0, 4, 4]} barSize={32} />
              <Bar dataKey="present" name="Present" stackId="a" fill="#111A62" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </Card>
  );
}
