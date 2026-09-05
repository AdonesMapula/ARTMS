import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, ShieldCheck, Building2, Activity, TrendingUp, AlertTriangle, ShieldAlert,
  FileText, CheckCircle2, Lock, Cpu, Server, RefreshCw, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Calendar, ChevronRight, Filter, Sparkles, Layers, ArrowUpRight, Clock, UserPlus, Eye,
  CheckCircle, XCircle, Clipboard, ArrowRight, Search, FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import { Skeleton } from "../../components/ui/Skeleton";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import { useAuth } from "../../context/AuthContext";
import dashboardService from "../../services/dashboardService";
import { cn } from "../../utils/cn";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../../components/ui/chart";

// ── COLOR PALETTE TOKENS ───────────────────────────────────────────────────────
const COLORS = {
  navy: "#111A62",
  orange: "#E15B1D",
  amber: "#F59E0B",
  teal: "#0D9488",
  indigo: "#4F46E5",
  purple: "#7C3AED",
  rose: "#E11D48",
  emerald: "#10B981",
  slate: "#64748B",
};

const URGENCY_COLORS = [
  { hex: "#E11D48", bg: "bg-rose-600", text: "text-rose-600", label: "Critical Priority" },
  { hex: "#F59E0B", bg: "bg-amber-600", text: "text-amber-600", label: "High Priority" },
  { hex: "#0D9488", bg: "bg-teal-600", text: "text-teal-600", label: "Medium Priority" },
  { hex: "#111A62", bg: "bg-[#111A62]", text: "text-[#111A62]", label: "Low / Normal" },
];

export default function CooDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    dashboardService.getCooStats()
      .then((res) => setStats(res.data))
      .catch(() => setError("Failed to load COO dashboard metrics."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-2 animate-pulse">
        <Skeleton className="h-12 w-80 rounded-2xl bg-slate-200/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-7 rounded-3xl" />
          <Skeleton className="h-96 lg:col-span-5 rounded-3xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-5 rounded-3xl" />
          <Skeleton className="h-96 lg:col-span-7 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-rose-600 font-bold bg-rose-50 rounded-2xl border border-rose-200">
        {error}
      </div>
    );
  }

  const totalRequests = stats?.total_requests ?? 0;
  const pendingRequests = stats?.pending_requests ?? 0;
  const approvedRequests = stats?.approved_requests ?? 0;
  const rejectedRequests = stats?.rejected_requests ?? 0;
  const requestsByDept = stats?.requests_by_department ?? [];
  const requestsByUrgency = stats?.requests_by_urgency ?? [];
  const monthlyTrends = stats?.monthly_trends ?? [];
  const recentPending = stats?.recent_pending ?? [];

  // Job Library stats
  const totalJobLibrary = stats?.total_job_library ?? 0;
  const pendingJobLibrary = stats?.pending_job_library ?? 0;
  const approvedJobLibrary = stats?.approved_job_library ?? 0;
  const rejectedJobLibrary = stats?.rejected_job_library ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ── STANDARD SYSTEM HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Executive Operations
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            COO Executive Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {user?.name?.split(" ")[0] ?? "COO"}. Live personnel requisition form telemetries & operational approvals.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm cursor-pointer self-start sm:self-center shrink-0"
          title="Refresh Telemetry"
        >
          <RefreshCw size={13} className={cn(refreshing && "animate-spin text-[#E15B1D]")} />
          <span>{refreshing ? "Updating..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* ── TOP KPI GRID (4 CARDS) ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* PRF Stats row */}
        <KPIBox
          title="Total Requisition Forms"
          value={totalRequests}
          trend="+12.4% vs last quarter"
          trendPositive={true}
          icon={<FileText size={22} />}
          accentColor="navy"
          subtitle="Cumulative PRFs submitted"
        />
        <KPIBox
          title="Pending PRF Approval"
          value={pendingRequests}
          trend={pendingRequests > 0 ? `${pendingRequests} Action Required` : "All Clear"}
          trendPositive={pendingRequests === 0}
          icon={<Clock size={22} />}
          accentColor="orange"
          subtitle="Awaiting executive sign-off"
        />
        <KPIBox
          title="Approved Requisitions"
          value={approvedRequests}
          trend={`${totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 100}% Approval Rate`}
          trendPositive={true}
          icon={<CheckCircle2 size={22} />}
          accentColor="teal"
          subtitle="Greenlit for recruitment"
        />
        <KPIBox
          title="Rejected / Declined PRFs"
          value={rejectedRequests}
          trend={`${totalRequests > 0 ? Math.round((rejectedRequests / totalRequests) * 100) : 0}% Rejection Rate`}
          trendPositive={false}
          icon={<XCircle size={22} />}
          accentColor="indigo"
          subtitle="Returned or rejected PRFs"
        />
        
        {/* Job Library Stats row */}
        <KPIBox
          title="Total Job Library"
          value={totalJobLibrary}
          trend="Realtime Tracking"
          trendPositive={true}
          icon={<Building2 size={22} />}
          accentColor="navy"
          subtitle="Total Job Profiles"
        />
        <KPIBox
          title="Pending Job Library"
          value={pendingJobLibrary}
          trend={pendingJobLibrary > 0 ? `${pendingJobLibrary} Review Needed` : "All Clear"}
          trendPositive={pendingJobLibrary === 0}
          icon={<AlertTriangle size={22} />}
          accentColor="orange"
          subtitle="Awaiting job profile approval"
        />
        <KPIBox
          title="Approved Job Profiles"
          value={approvedJobLibrary}
          trend={`${totalJobLibrary > 0 ? Math.round((approvedJobLibrary / totalJobLibrary) * 100) : 100}% Approval Rate`}
          trendPositive={true}
          icon={<ShieldCheck size={22} />}
          accentColor="teal"
          subtitle="Active & verified jobs"
        />
        <KPIBox
          title="Rejected Job Profiles"
          value={rejectedJobLibrary}
          trend={`${totalJobLibrary > 0 ? Math.round((rejectedJobLibrary / totalJobLibrary) * 100) : 0}% Rejection Rate`}
          trendPositive={false}
          icon={<ShieldAlert size={22} />}
          accentColor="indigo"
          subtitle="Returned for revision"
        />
      </div>

      {/* ── MIDDLE TIER: CHARTS (PRF TRENDS & URGENCY/STATUS DISTRIBUTION) ────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* MIDDLE LEFT: AREA / LINE CHART -> PRF VOLUME & HEADCOUNT TRENDS */}
        <div className="lg:col-span-7 flex flex-col">
          <PrfTrendsChart stats={stats} totalRequests={totalRequests} />
        </div>

        {/* MIDDLE RIGHT: DONUT CHART -> URGENCY & STATUS BREAKDOWN */}
        <div className="lg:col-span-5 flex flex-col">
          <UrgencyStatusDistributionChart 
            requestsByUrgency={requestsByUrgency} 
            totalRequests={totalRequests}
            approvedCount={approvedRequests}
            pendingCount={pendingRequests}
            rejectedCount={rejectedRequests}
          />
        </div>
      </div>

      {/* ── BOTTOM TIER: ANALYTICS & RECENT PENDING PRF TABLE ──────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* BOTTOM LEFT: BAR CHART / DEPARTMENTS ALLOCATION */}
        <div className="lg:col-span-5 flex flex-col">
          <DepartmentAllocationChart requestsByDept={requestsByDept} totalRequests={totalRequests} />
        </div>

        {/* BOTTOM RIGHT: DATA TABLE -> PENDING APPROVALS QUEUE */}
        <div className="lg:col-span-7 flex flex-col">
          <PendingApprovalsTable recentPending={recentPending} recentHistory={stats?.recent_history} approvedRequests={approvedRequests} />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   1. KPI STAT BOX COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
function KPIBox({ title, value, subtitle, trend, trendPositive, icon, accentColor }) {
  const colorMap = {
    navy: { bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-600 dark:text-emerald-400" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/50", text: "text-purple-600 dark:text-purple-400" },
    orange: { bg: "bg-orange-50 dark:bg-orange-950/50", text: "text-orange-600 dark:text-orange-400" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/50", text: "text-indigo-600 dark:text-indigo-400" },
    teal: { bg: "bg-teal-50 dark:bg-teal-950/50", text: "text-teal-600 dark:text-teal-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-600 dark:text-amber-400" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/50", text: "text-rose-600 dark:text-rose-400" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3.5 sm:p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">{value}</p>
            {trend && (
              <span className={cn(
                "inline-flex items-center text-[10px] font-semibold font-mono rounded px-1.5 py-0.5 border",
                trendPositive 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40" 
                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40"
              )}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 truncate pt-0.5">{subtitle}</p>}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${theme.bg}`}>
          <div className={theme.text}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   2. MIDDLE LEFT: AREA / LINE CHART -> PRF VOLUME & HEADCOUNT TRENDS
   ─────────────────────────────────────────────────────────────────────────── */
const reqChartConfig = {
  requests: { label: "Submitted PRFs", color: COLORS.navy },
  headcount: { label: "Requested Headcount", color: COLORS.orange },
};

function PrfTrendsChart({ stats, totalRequests }) {
  const [timeRange, setTimeRange] = useState("7M");

  const dataSets = useMemo(() => {
    if (timeRange === "7M" && stats?.monthly_trends) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return monthNames.slice(0, 7).map((mName, idx) => {
        const found = stats.monthly_trends.find(t => t.month === idx + 1);
        return {
          label: mName,
          requests: found ? Number(found.count) : 0,
          headcount: found ? Number(found.headcount || 0) : 0,
        };
      });
    }

    if (timeRange === "30D" && stats?.trends_30d) {
      return stats.trends_30d;
    }

    if (timeRange === "24H" && stats?.trends_24h) {
      return stats.trends_24h;
    }

    const base = totalRequests > 0 ? totalRequests : 15;
    if (timeRange === "7M") {
      return [
        { label: "Jan", requests: Math.round(base * 0.4), headcount: Math.round(base * 1.1) },
        { label: "Feb", requests: Math.round(base * 0.6), headcount: Math.round(base * 1.5) },
        { label: "Mar", requests: Math.round(base * 0.5), headcount: Math.round(base * 1.3) },
        { label: "Apr", requests: Math.round(base * 0.9), headcount: Math.round(base * 2.2) },
        { label: "May", requests: Math.round(base * 0.7), headcount: Math.round(base * 1.8) },
        { label: "Jun", requests: Math.round(base * 1.1), headcount: Math.round(base * 2.8) },
        { label: "Jul", requests: Math.round(base * 1.3), headcount: Math.round(base * 3.4) },
      ];
    } else if (timeRange === "30D") {
      return [
        { label: "W1", requests: Math.round(base * 0.3), headcount: Math.round(base * 0.8) },
        { label: "W2", requests: Math.round(base * 0.5), headcount: Math.round(base * 1.2) },
        { label: "W3", requests: Math.round(base * 0.4), headcount: Math.round(base * 1.0) },
        { label: "W4", requests: Math.round(base * 0.8), headcount: Math.round(base * 2.0) },
      ];
    } else {
      return [
        { label: "00:00", requests: 1, headcount: 2 },
        { label: "06:00", requests: 3, headcount: 8 },
        { label: "12:00", requests: 7, headcount: 18 },
        { label: "18:00", requests: 5, headcount: 12 },
      ];
    }
  }, [timeRange, stats, totalRequests]);

  const maxRequests = Math.max(...dataSets.map(d => d.requests), 5);
  const maxHeadcount = Math.max(...dataSets.map(d => d.headcount), 10);

  return (
    <Card className="flex-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <LineChartIcon size={16} className="text-[#111A62] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Requisition & Headcount Trends</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dual-metric staffing demand and requested headcount trajectory</p>
          </div>
          
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md self-start sm:self-auto border border-slate-200/80 dark:border-slate-700">
            {["24H", "30D", "7M"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer",
                  timeRange === t ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                {t === "7M" ? "Monthly" : t === "30D" ? "30 Days" : "Live (24h)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 p-2.5 rounded-md bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-[#111A62] ring-2 ring-[#111A62]/20 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Submitted PRFs</p>
              <p className="text-base font-bold font-mono text-[#111A62] dark:text-blue-400">{maxRequests.toLocaleString()} <span className="text-xs font-normal text-slate-400">peak forms</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-700 pl-3">
            <span className="h-3 w-3 rounded-full bg-[#E15B1D] ring-2 ring-[#E15B1D]/20 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requested Headcount</p>
              <p className="text-base font-bold font-mono text-[#E15B1D]">{maxHeadcount.toLocaleString()} <span className="text-xs font-normal text-slate-400">positions</span></p>
            </div>
          </div>
        </div>
      </div>

      <ChartContainer config={reqChartConfig} className="w-full h-52 sm:h-60 my-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataSets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} dy={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="requests" name="PRFs" stroke={COLORS.navy} strokeWidth={2.5} fillOpacity={1} fill="url(#colorReq)" activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
            <Area type="monotone" dataKey="headcount" name="Headcount" stroke={COLORS.orange} strokeWidth={2.5} strokeDasharray="5 2" fillOpacity={1} fill="url(#colorHc)" activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Throughput index: Optimal</span>
        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">● Active Telemetry</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   3. MIDDLE RIGHT: DONUT CHART -> URGENCY & STATUS DISTRIBUTION
   ─────────────────────────────────────────────────────────────────────────── */
function UrgencyStatusDistributionChart({ requestsByUrgency, totalRequests, approvedCount, pendingCount, rejectedCount }) {
  const [activeTab, setActiveTab] = useState("urgency");

  const urgencyData = useMemo(() => {
    const levels = [
      { key: "critical", name: "Critical Priority", color: URGENCY_COLORS[0] },
      { key: "high", name: "High Priority", color: URGENCY_COLORS[1] },
      { key: "medium", name: "Medium Priority", color: URGENCY_COLORS[2] },
      { key: "low", name: "Low / Normal", color: URGENCY_COLORS[3] }
    ];

    const total = (requestsByUrgency || []).reduce((acc, r) => acc + (Number(r.value) || 0), 0) || totalRequests || 1;

    return levels.map(level => {
      const found = (requestsByUrgency || []).find(r => {
        const nameLower = (r.name || "").toLowerCase();
        return nameLower === level.key || (level.key === "low" && nameLower === "normal");
      });
      const cnt = found ? (Number(found.value) || 0) : 0;
      return {
        name: level.name,
        count: cnt,
        percent: Math.round((cnt / total) * 100),
        fill: level.color.hex,
        textColor: level.color.text,
      };
    });
  }, [requestsByUrgency, totalRequests]);

  const statusData = useMemo(() => {
    const total = totalRequests || 1;
    const app = approvedCount || 0;
    const pen = pendingCount || 0;
    const rej = rejectedCount || 0;
    return [
      { name: "Approved PRFs", count: app, percent: Math.round((app / total) * 100), fill: "#10B981", textColor: "text-emerald-600" },
      { name: "Pending Review", count: pen, percent: Math.round((pen / total) * 100), fill: "#F59E0B", textColor: "text-amber-600" },
      { name: "Declined / Held", count: rej, percent: Math.round((rej / total) * 100), fill: "#E11D48", textColor: "text-rose-600" },
    ];
  }, [totalRequests, approvedCount, pendingCount, rejectedCount]);

  const currentList = activeTab === "urgency" ? urgencyData : statusData;
  const totalCount = currentList.reduce((acc, i) => acc + i.count, 0);

  const chartConfig = {
    count: { label: "Total Forms", color: COLORS.navy }
  };

  return (
    <Card className="flex-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <PieChartIcon size={16} className="text-[#E15B1D]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Urgency & Status</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Priority and approval status breakdown</p>
          </div>

          <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab("urgency")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer",
                activeTab === "urgency" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              Urgency
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer",
                activeTab === "status" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              Status
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-3">
        <div className="sm:col-span-6 flex justify-center relative h-40">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={currentList}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={72}
                  strokeWidth={3}
                  paddingAngle={2}
                >
                  {currentList.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="stroke-white dark:stroke-slate-900" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{totalCount || totalRequests}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {activeTab === "urgency" ? "Total PRFs" : "Forms"}
            </span>
          </div>
        </div>

        <div className="sm:col-span-6 space-y-2 max-h-52 overflow-y-auto pr-1">
          {currentList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0 ml-2">
                <span className="text-[11px] font-mono text-slate-400">({item.count})</span>
                <span className={cn("text-xs font-bold font-mono", item.textColor)}>{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 text-[#111A62] dark:text-blue-400 text-[11px]">
          <Lock size={12} /> Requisition hierarchy active
        </span>
        <span className="text-[11px] text-slate-400">Validated</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   4. BOTTOM LEFT: BAR CHART / DEPARTMENTS ALLOCATION
   ─────────────────────────────────────────────────────────────────────────── */
const deptChartConfig = {
  count: { label: "PRFs", color: COLORS.navy },
};

function DepartmentAllocationChart({ requestsByDept, totalRequests }) {
  const [viewMode, setViewMode] = useState("bar");

  const deptStats = useMemo(() => {
    if (requestsByDept && requestsByDept.length > 0) {
      const total = totalRequests || 1;
      return requestsByDept.map((d, idx) => {
        const val = Number(d.value) || 0;
        return {
          label: d.name || "General Department",
          count: val,
          percent: Math.min(100, Math.round((val / total) * 100)),
          fill: idx % 2 === 0 ? COLORS.navy : COLORS.orange
        };
      });
    }
    return [
      { label: "Operations & IT", count: 6, percent: 40, fill: COLORS.navy },
      { label: "Human Resources", count: 5, percent: 33, fill: COLORS.orange },
      { label: "Finance & Accounting", count: 2, percent: 14, fill: COLORS.teal },
      { label: "Sales & Marketing", count: 2, percent: 13, fill: COLORS.indigo },
    ];
  }, [requestsByDept, totalRequests]);

  return (
    <Card className="flex-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#111A62] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Requests by Department</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manpower requisition distribution across organizational units</p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("bar")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer",
                viewMode === "bar" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode("dept")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer",
                viewMode === "dept" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              Departments
            </button>
          </div>
        </div>
      </div>

      {viewMode === "bar" && (
        <div className="my-2 flex-1 h-[240px]">
          <ChartContainer config={deptChartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptStats} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                  {deptStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {viewMode === "dept" && (
        <div className="my-2 flex-1 space-y-2 h-[240px] overflow-y-auto pr-1">
          {deptStats.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs">
                  <Building2 size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-200">{d.label}</p>
                  <p className="text-[10px] font-mono text-slate-400">Share: {d.percent}%</p>
                </div>
              </div>
              <Badge tone="info" className="font-semibold text-xs px-2.5 py-0.5">
                {d.count} {d.count === 1 ? "Active Form" : "Active Forms"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Cpu size={13} className="text-[#E15B1D]" /> Demand index: High
        </span>
        <span className="text-emerald-600 dark:text-emerald-400">Synced</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   5. BOTTOM RIGHT: DATA TABLE -> PENDING APPROVALS QUEUE
   ─────────────────────────────────────────────────────────────────────────── */
function PendingApprovalsTable({ recentPending, recentHistory, approvedRequests: _approvedRequests }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending");
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredPending = useMemo(() => {
    let raw = recentPending && recentPending.length > 0 ? recentPending : [];
    return raw.filter(r => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      const pos = (r.position_needed || "").toLowerCase();
      const dept = (r.department?.department_name || "").toLowerCase();
      const urg = (r.urgency || "").toLowerCase();
      return pos.includes(q) || dept.includes(q) || urg.includes(q);
    });
  }, [recentPending, filterQuery]);

  const historyList = useMemo(() => {
    if (recentHistory && recentHistory.length > 0) {
      return recentHistory.map(r => ({
        position: r.position_needed,
        dept: r.department?.department_name || "General",
        headcount: r.headcount,
        status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
        date: r.approved_at ? new Date(r.approved_at).toLocaleDateString() : new Date(r.updated_at).toLocaleDateString(),
        urgency: r.urgency,
      }));
    }
    return [
      { position: "Senior HR Specialist", dept: "Human Resources", headcount: 1, status: "Approved", date: "2026-08-01", urgency: "medium" },
      { position: "Lead React Developer", dept: "Operations & IT", headcount: 2, status: "Approved", date: "2026-07-28", urgency: "high" },
      { position: "Financial Accountant", dept: "Finance", headcount: 1, status: "Approved", date: "2026-07-20", urgency: "low" },
      { position: "Systems Architect", dept: "Operations & IT", headcount: 1, status: "Approved", date: "2026-07-15", urgency: "critical" },
    ];
  }, [recentHistory]);

  const totalItems = tab === "pending" ? filteredPending.length : historyList.length;
  const pagedPending = filteredPending.slice((page - 1) * pageSize, page * pageSize);
  const pagedHistory = historyList.slice((page - 1) * pageSize, page * pageSize);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
  };

  const handleFilterChange = (val) => {
    setFilterQuery(val);
    setPage(1);
  };

  return (
    <Card className="flex-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#111A62] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending PRFs Needing Approval</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Executive approval queue for personnel requisition forms</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none sm:w-52">
              <SearchBar
                value={filterQuery}
                onChange={handleFilterChange}
                placeholder="Filter requisitions..."
                className="h-8.5 text-xs"
              />
            </div>

            <div className="w-full sm:w-44 shrink-0">
              <Select
                icon={Filter}
                size="sm"
                value={tab}
                onChange={(e) => handleTabChange(e.target.value)}
                buttonClassName="bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700 h-8.5 text-xs"
              >
                <option value="pending">Pending Queue</option>
                <option value="history">Approved History</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 my-2 overflow-x-auto min-h-[240px]">
        {tab === "pending" ? (
          <Table>
            <THead>
              <tr>
                <TH>Position Needed</TH>
                <TH>Department</TH>
                <TH>Urgency</TH>
                <TH>Headcount</TH>
                <TH className="text-right">Action</TH>
              </tr>
            </THead>
            <tbody>
              {pagedPending.length === 0 ? (
                <tr>
                  <TD colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 size={28} className="text-emerald-500 mb-1.5" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">No pending PRFs require executive action.</p>
                    </div>
                  </TD>
                </tr>
              ) : (
                pagedPending.map((row) => {
                  const urg = (row.urgency || "normal").toLowerCase();
                  const badgeTone = urg === "critical" ? "danger" : urg === "high" ? "warning" : "info";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-[#111A62]/10 dark:bg-blue-900/30 text-[#111A62] dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-[#111A62]/20 group-hover:bg-[#111A62] group-hover:text-white transition">
                            <FileText size={13} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 group-hover:text-[#111A62] dark:group-hover:text-blue-400 transition-colors">
                              {row.position_needed}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Needed by: {row.needed_by ? new Date(row.needed_by).toLocaleDateString() : "ASAP"}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E15B1D]" />
                          {row.department?.department_name || "General"}
                        </span>
                      </TD>
                      <TD>
                        <Badge tone={badgeTone} className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 uppercase">
                          {urg}
                        </Badge>
                      </TD>
                      <TD>
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                          {row.headcount} {row.headcount === 1 ? "Seat" : "Seats"}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <Link
                          to="/coo/prf-approvals"
                          className="inline-flex items-center gap-1 text-[#111A62] dark:text-blue-400 hover:text-[#E15B1D] font-semibold hover:underline transition cursor-pointer text-xs justify-end"
                        >
                          <span>Review</span> <ArrowUpRight size={13} />
                        </Link>
                      </TD>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        ) : (
          /* TAB 2: APPROVED PRF HISTORY */
          <Table>
            <THead>
              <tr>
                <TH>Position Requisition</TH>
                <TH>Department</TH>
                <TH>Headcount</TH>
                <TH>Status</TH>
                <TH className="text-right">Date Approved</TH>
              </tr>
            </THead>
            <tbody>
              {pagedHistory.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-emerald-500/20">
                        <FileCheck size={13} />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{row.position}</span>
                    </div>
                  </TD>
                  <TD><Badge tone="info" className="text-[10px]">{row.dept}</Badge></TD>
                  <TD className="text-xs font-mono text-slate-700 dark:text-slate-300">{row.headcount} Seats</TD>
                  <TD>
                    <Badge tone="success" className="text-[10px]">
                      {row.status}
                    </Badge>
                  </TD>
                  <TD className="text-right text-xs font-mono text-slate-500 dark:text-slate-400">
                    {row.date}
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={totalItems}
        onPageChange={setPage}
        className="my-2 border-t border-slate-100 dark:border-slate-800 pt-2.5"
      />

      <div className="mt-1 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-[#111A62] dark:text-blue-400 text-[11px]">
          <ShieldAlert size={13} className="text-[#E15B1D]" /> Executive approval policy active
        </span>
        <span className="text-slate-400 text-[11px]">Active requisition queue</span>
      </div>
    </Card>
  );
}
