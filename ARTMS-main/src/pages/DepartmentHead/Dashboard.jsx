import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  FiClock, FiClipboard, FiTrendingUp, FiUsers, FiBell, FiPlusCircle, 
  FiCheckCircle, FiActivity, FiLayers, FiBarChart2 
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import dashboardService from "../../services/dashboardService";
import { cn } from "../../utils/cn";

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
          <DepartmentActivityChart />
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
  const themes = {
    navy: { bg: "bg-[#111A62]/10", border: "border-[#111A62]/20", iconText: "text-[#111A62]" },
    orange: { bg: "bg-[#E15B1D]/10", border: "border-[#E15B1D]/20", iconText: "text-[#E15B1D]" },
    teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", iconText: "text-teal-600" },
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", iconText: "text-indigo-600" },
  };
  const current = themes[accentColor] || themes.navy;

  return (
    <Card className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
            {trend && (
              <span className={cn(
                "inline-flex items-center text-[10px] font-extrabold rounded-full px-2 py-0.5 mt-1",
                trendPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-amber-50 text-amber-700 border border-amber-200/60"
              )}>
                {trend}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400 pt-1">{subtitle}</p>
        </div>
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition",
          current.bg, current.iconText
        )}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ── SYNTHETIC CHART COMPONENT ────────────────────────────────────────────────
function DepartmentActivityChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Synthetic data for visual appeal
  const data = [
    { day: "Mon", present: 85, onLeave: 5 },
    { day: "Tue", present: 90, onLeave: 2 },
    { day: "Wed", present: 88, onLeave: 4 },
    { day: "Thu", present: 92, onLeave: 1 },
    { day: "Fri", present: 75, onLeave: 10 },
    { day: "Sat", present: 30, onLeave: 0 },
    { day: "Sun", present: 20, onLeave: 0 },
  ];

  const maxVal = 100;
  const H = 240;

  return (
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col min-h-[380px]">
      <div className="flex items-start sm:items-center justify-between mb-8 flex-col sm:flex-row gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiBarChart2 size={18} className="text-[#111A62]" />
            <h3 className="text-base font-extrabold text-slate-900">Weekly Department Activity</h3>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">Simulated attendance & leave trends for the week</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-[#111A62]"></span> Present</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-[#E15B1D]"></span> On Leave</div>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-3 px-2 mt-auto">
        {data.map((d, i) => {
          const pHeight = (d.present / maxVal) * H;
          const lHeight = (d.onLeave / maxVal) * H;
          return (
            <div key={i} className="flex flex-col items-center gap-3 w-full group">
              <div className="relative flex items-end justify-center w-full h-[240px] bg-slate-50/50 rounded-2xl overflow-hidden group-hover:bg-slate-100/60 transition border border-transparent group-hover:border-slate-200/50">
                {/* Tooltip on hover */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                  {d.present}% Present
                </div>
                
                <div className="w-1/3 min-w-[14px] bg-[#E15B1D] rounded-t-lg mx-0.5 transition-all duration-700 ease-out group-hover:brightness-110" style={{ height: `${lHeight}px` }} />
                <div className="w-1/3 min-w-[14px] bg-[#111A62] rounded-t-lg mx-0.5 transition-all duration-700 ease-out group-hover:brightness-110" style={{ height: `${pHeight}px` }} />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-[#111A62] transition-colors">{d.day}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
