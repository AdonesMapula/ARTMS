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
      <Skeleton className="h-10 w-72 rounded-md bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-80 lg:col-span-8 rounded-lg" />
        <Skeleton className="h-80 lg:col-span-4 rounded-lg" />
      </div>
    </div>
  );
  if (error) return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400">
      {error}
    </div>
  );

  // Values
  const deptEmployees = stats?.department_employees ?? 0;
  const pendingRequests = stats?.pending_requests ?? 0;
  const openPostings = stats?.open_postings ?? 0;
  const pendingLeaves = stats?.pending_leaves ?? 0;
  const attendanceToday = stats?.attendance_today ?? 0;

  return (
    <div className="space-y-5 pb-8">
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FiLayers className="text-slate-400" /> Department Overview
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Head Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit manpower requests and monitor team capacity and attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <FiActivity className={cn(refreshing && "animate-spin text-amber-500")} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
          <Button as={Link} to="/department-head/manpower-request" variant="accent" className="rounded-md shadow-sm text-xs py-1.5 px-3 shrink-0">
            <FiPlusCircle size={14} /> New Request
          </Button>
        </div>
      </div>

      {/* ── KPI GRID ──────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPIBox
          title="Active Employees"
          value={deptEmployees}
          icon={<FiUsers size={16} />}
          accentColor="navy"
          subtitle="Total department headcount"
        />
        <KPIBox
          title="Pending Requests"
          value={pendingRequests}
          trend={pendingRequests > 0 ? "Action Req." : "Clear"}
          trendPositive={pendingRequests === 0}
          icon={<FiClock size={16} />}
          accentColor="orange"
          subtitle="Awaiting approvals"
        />
        <KPIBox
          title="Open Postings"
          value={openPostings}
          icon={<FiTrendingUp size={16} />}
          accentColor="teal"
          subtitle="Active job requisitions"
        />
        <KPIBox
          title="Pending Leaves"
          value={pendingLeaves}
          trend={pendingLeaves > 0 ? "Review" : "Up to date"}
          trendPositive={pendingLeaves === 0}
          icon={<FiClipboard size={16} />}
          accentColor="indigo"
          subtitle="Leave applications"
        />
      </div>

      {/* ── MIDDLE TIER (CHART & QUICK ACTIONS) ───────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-12 items-stretch">
        {/* CHART SECTON */}
        <div className="lg:col-span-8 flex flex-col">
          <DepartmentActivityChart weeklyActivity={stats?.weekly_activity} />
        </div>

        {/* QUICK ACTIONS & ATTENDANCE */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <FiCheckCircle size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Today's Attendance</h3>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {deptEmployees > 0 ? `${Math.round((attendanceToday / deptEmployees) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{attendanceToday}</span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/ {deptEmployees} Present</span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
                style={{ width: `${deptEmployees > 0 ? Math.min((attendanceToday / deptEmployees) * 100, 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="flex-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FiActivity size={12} /> Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Link to="/department-head/manpower-request" className="group flex items-center justify-between rounded-md border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 shadow-xs border border-slate-200/60 dark:border-slate-700 transition-colors">
                    <FiPlusCircle size={14} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Submit PRF</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">Requisition &rarr;</span>
              </Link>
              <Link to="/department-head/request-history" className="group flex items-center justify-between rounded-md border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:text-amber-600 shadow-xs border border-slate-200/60 dark:border-slate-700 transition-colors">
                    <FiTrendingUp size={14} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Request History</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">History &rarr;</span>
              </Link>
              <Link to="/department-head/notifications" className="group flex items-center justify-between rounded-md border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:text-teal-600 shadow-xs border border-slate-200/60 dark:border-slate-700 transition-colors">
                    <FiBell size={14} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Alerts & Logs</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">View &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KPI BOX ──────────────────────────────────────────────────────────────────
function KPIBox({ title, value, subtitle, trend, trendPositive, icon, accentColor }) {
  const colorMap = {
    navy: { bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/60", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/60", text: "text-emerald-600 dark:text-emerald-400" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/60", text: "text-purple-600 dark:text-purple-400" },
    orange: { bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/60", text: "text-amber-600 dark:text-amber-400" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/60", text: "text-indigo-600 dark:text-indigo-400" },
    teal: { bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-900/60", text: "text-teal-600 dark:text-teal-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/60", text: "text-amber-600 dark:text-amber-400" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/60", text: "text-rose-600 dark:text-rose-400" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
            {trend && (
              <span className={cn(
                "inline-flex items-center text-[10px] font-mono font-semibold rounded px-1.5 py-0.5 border",
                trendPositive 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60" 
                  : "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60"
              )}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">{subtitle}</p>}
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${theme.bg}`}>
          <div className={theme.text}>
            {icon}
          </div>
        </div>
      </div>
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
    <div className="flex-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col min-h-[360px]">
      <div className="flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <FiBarChart2 size={15} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Weekly Department Activity</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live attendance & leave volume over the past 7 days</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#111A62]"></span> <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">Present</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#E15B1D]"></span> <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">On Leave</span></div>
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
              <Bar dataKey="onLeave" name="On Leave" stackId="a" fill="#E15B1D" radius={[0, 0, 2, 2]} barSize={28} />
              <Bar dataKey="present" name="Present" stackId="a" fill="#111A62" radius={[2, 2, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
