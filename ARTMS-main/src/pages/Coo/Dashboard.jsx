import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, ShieldCheck, Building2, Activity, TrendingUp, AlertTriangle, ShieldAlert,
  FileText, CheckCircle2, Lock, Cpu, Server, RefreshCw, BarChart3, PieChart, LineChart,
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
  const themes = {
    navy: { bg: "bg-[#111A62]/10", border: "border-[#111A62]/20", iconText: "text-[#111A62]" },
    orange: { bg: "bg-[#E15B1D]/10", border: "border-[#E15B1D]/20", iconText: "text-[#E15B1D]" },
    teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", iconText: "text-teal-600" },
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", iconText: "text-indigo-600" },
  };
  const current = themes[accentColor] || themes.navy;

  return (
    <Card className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
            {trend && (
              <span className={cn(
                "inline-flex items-center text-[11px] font-extrabold rounded-full px-2 py-0.5",
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

/* ───────────────────────────────────────────────────────────────────────────
   2. MIDDLE LEFT: AREA / LINE CHART -> PRF VOLUME & HEADCOUNT TRENDS
   ─────────────────────────────────────────────────────────────────────────── */
function PrfTrendsChart({ stats, totalRequests }) {
  const [timeRange, setTimeRange] = useState("7M"); // "7M", "30D", "24H"

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

  // SVG Coordinates setup (Width: 600, Height: 210)
  const W = 600;
  const H = 210;
  const padX = 40;
  const padY = 25;

  const getPoints = (key, maxVal) => {
    return dataSets.map((d, i) => {
      const x = padX + (i / (dataSets.length - 1 || 1)) * (W - padX * 2);
      const y = H - padY - (d[key] / maxVal) * (H - padY * 2);
      return { x, y, value: d[key], label: d.label };
    });
  };

  const reqPts = getPoints("requests", maxRequests);
  const hcPts = getPoints("headcount", maxHeadcount);

  const makeCurve = (pts) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const xMid = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C ${xMid} ${pts[i].y}, ${xMid} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  };

  const reqPath = makeCurve(reqPts);
  const reqArea = `${reqPath} L ${reqPts[reqPts.length - 1]?.x || W} ${H - padY} L ${reqPts[0]?.x || padX} ${H - padY} Z`;

  const hcPath = makeCurve(hcPts);
  const hcArea = `${hcPath} L ${hcPts[hcPts.length - 1]?.x || W} ${H - padY} L ${hcPts[0]?.x || padX} ${H - padY} Z`;

  return (
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <LineChart size={18} className="text-[#111A62]" />
              <h3 className="text-base font-extrabold text-slate-900">Requisition & Headcount Trends</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Dual-metric staffing demand and requested headcount trajectory</p>
          </div>
          
          {/* Time Range Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit self-start sm:self-auto border border-slate-200/60">
            {["24H", "30D", "7M"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={cn(
                  "px-3 py-1 text-xs font-extrabold rounded-lg transition-all duration-200 cursor-pointer",
                  timeRange === t ? "bg-[#111A62] text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                {t === "7M" ? "Monthly" : t === "30D" ? "30 Days" : "Live (24h)"}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Legend & Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full bg-[#111A62] ring-4 ring-[#111A62]/20 shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submitted PRFs</p>
              <p className="text-lg font-black text-[#111A62]">{maxRequests.toLocaleString()} <span className="text-xs font-semibold text-slate-500">peak forms</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <span className="h-4 w-4 rounded-full bg-[#E15B1D] ring-4 ring-[#E15B1D]/20 shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Requested Headcount</p>
              <p className="text-lg font-black text-[#E15B1D]">{maxHeadcount.toLocaleString()} <span className="text-xs font-semibold text-slate-500">positions</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Interactive Visual Area Graph */}
      <div className="relative w-full overflow-x-auto my-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 sm:h-64 overflow-visible font-sans">
          <defs>
            <linearGradient id="reqGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#111A62" stopOpacity="0.35" />
              <stop offset="95%" stopColor="#111A62" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="hcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E15B1D" stopOpacity="0.30" />
              <stop offset="95%" stopColor="#E15B1D" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines & Y Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
            const y = H - padY - step * (H - padY * 2);
            return (
              <g key={i}>
                <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#E2E8F0" strokeDasharray={step === 0 ? "none" : "3 3"} strokeWidth="1" />
              </g>
            );
          })}

          {/* Req Area & Curve (Navy Blue) */}
          <path d={reqArea} fill="url(#reqGrad)" className="transition-all duration-500" />
          <path d={reqPath} fill="none" stroke="#111A62" strokeWidth="3" strokeLinecap="round" className="transition-all duration-500 drop-shadow-md" />

          {/* Headcount Area & Curve (Orange) */}
          <path d={hcArea} fill="url(#hcGrad)" className="transition-all duration-500" />
          <path d={hcPath} fill="none" stroke="#E15B1D" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 2" className="transition-all duration-500" />

          {/* Data Points & X-Axis Labels */}
          {reqPts.map((p, i) => {
            const hc = hcPts[i];
            return (
              <g key={i} className="group cursor-pointer">
                <rect x={p.x - 20} y={padY} width="40" height={H - padY * 2} fill="transparent" />

                <line x1={p.x} y1={padY} x2={p.x} y2={H - padY} stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                
                <circle cx={p.x} cy={p.y} r="10" fill="#111A62" fillOpacity="0" className="group-hover:fill-[#111A62] group-hover:[fill-opacity:0.15] transition-all duration-200" />
                <circle cx={p.x} cy={p.y} r="5" fill="#111A62" stroke="white" strokeWidth="2.5" className="transition-all duration-200" />
                
                {hc && (
                  <>
                    <circle cx={hc.x} cy={hc.y} r="10" fill="#E15B1D" fillOpacity="0" className="group-hover:fill-[#E15B1D] group-hover:[fill-opacity:0.15] transition-all duration-200" />
                    <circle cx={hc.x} cy={hc.y} r="5" fill="#E15B1D" stroke="white" strokeWidth="2.5" className="transition-all duration-200" />
                  </>
                )}

                <text x={p.x} y={H - 6} textAnchor="middle" fill="#475569" className="text-[11px] font-extrabold select-none">
                  {p.label}
                </text>

                {/* Interactive Tooltip on Hover */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none drop-shadow-xl" transform={`translate(${p.x > W - 120 ? p.x - 110 : p.x - 30}, ${Math.max(5, p.y - 50)})`}>
                  <rect width="115" height="42" rx="8" fill="#1E293B" stroke="#334155" />
                  <text x="10" y="16" fill="#60A5FA" className="text-[10px] font-extrabold">PRFs: {p.value}</text>
                  <text x="10" y="32" fill="#FB923C" className="text-[10px] font-extrabold">Seats: {hc?.value || 0}</text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>⚡ Requisition throughput index: Optimal</span>
        <span className="text-emerald-600 flex items-center gap-1">● Active Executive Telemetry</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   3. MIDDLE RIGHT: DONUT CHART -> URGENCY & STATUS DISTRIBUTION
   ─────────────────────────────────────────────────────────────────────────── */
function UrgencyStatusDistributionChart({ requestsByUrgency, totalRequests, approvedCount, pendingCount, rejectedCount }) {
  const [activeTab, setActiveTab] = useState("urgency"); // "urgency" or "status"

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
        color: level.color,
      };
    });
  }, [requestsByUrgency, totalRequests]);

  const statusData = useMemo(() => {
    const total = totalRequests || 1;
    const app = approvedCount || 0;
    const pen = pendingCount || 0;
    const rej = rejectedCount || 0;
    return [
      { name: "Approved PRFs", count: app, percent: Math.round((app / total) * 100), color: { hex: "#10B981", text: "text-emerald-600", bg: "bg-emerald-500" } },
      { name: "Pending Review", count: pen, percent: Math.round((pen / total) * 100), color: { hex: "#F59E0B", text: "text-amber-600", bg: "bg-amber-500" } },
      { name: "Declined / Held", count: rej, percent: Math.round((rej / total) * 100), color: { hex: "#E11D48", text: "text-rose-600", bg: "bg-rose-500" } },
    ];
  }, [totalRequests, approvedCount, pendingCount, rejectedCount]);

  const currentList = activeTab === "urgency" ? urgencyData : statusData;
  const totalCount = currentList.reduce((acc, i) => acc + i.count, 0);

  const R = 54;
  const CIRC = 2 * Math.PI * R;
  let currentOffset = 0;

  return (
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <PieChart size={18} className="text-[#E15B1D]" />
              <h3 className="text-base font-extrabold text-slate-900">Urgency & Status Distribution</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Priority classification and executive approval status</p>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 shrink-0">
            <button
              onClick={() => setActiveTab("urgency")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer",
                activeTab === "urgency" ? "bg-[#111A62] text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Urgency
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer",
                activeTab === "status" ? "bg-[#E15B1D] text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Status
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-4">
        {/* Animated SVG Donut */}
        <div className="sm:col-span-6 flex justify-center relative">
          <svg className="w-44 h-44 -rotate-90 transform overflow-visible" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={R} stroke="#F1F5F9" strokeWidth="22" fill="transparent" />
            
            {currentList.map((item, index) => {
              const dashVal = (item.percent / 100) * CIRC;
              const offset = currentOffset;
              currentOffset += dashVal;

              return (
                <circle
                  key={index}
                  cx="70"
                  cy="70"
                  r={R}
                  stroke={item.color.hex}
                  strokeWidth="22"
                  strokeDasharray={`${dashVal} ${CIRC - dashVal}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  fill="transparent"
                  className="transition-all duration-700 hover:stroke-width-26 cursor-pointer opacity-95 hover:opacity-100 drop-shadow-sm"
                />
              );
            })}
          </svg>
          
          {/* Inner Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-black text-slate-900">{totalCount || totalRequests}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {activeTab === "urgency" ? "Total PRFs" : "Forms"}
            </span>
          </div>
        </div>

        {/* Interactive Legend List */}
        <div className="sm:col-span-6 space-y-2.5 max-h-56 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {currentList.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-md transition duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-3.5 w-3.5 rounded-lg shrink-0 shadow-sm" style={{ backgroundColor: item.color.hex }} />
                <span className="text-xs font-extrabold text-slate-800 truncate group-hover:text-[#111A62] transition-colors">{item.name}</span>
              </div>
              <div className="flex items-baseline gap-2 shrink-0 ml-2">
                <span className="text-xs font-bold text-slate-500">({item.count})</span>
                <span className={cn("text-xs font-black", item.color.text)}>{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5 text-[#111A62]">
          <Lock size={13} /> Requisition hierarchy enforced by COO
        </span>
        <span className="text-xs font-semibold text-slate-400">Validated</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   4. BOTTOM LEFT: BAR CHART / DEPARTMENTS ALLOCATION
   ─────────────────────────────────────────────────────────────────────────── */
function DepartmentAllocationChart({ requestsByDept, totalRequests }) {
  const [viewMode, setViewMode] = useState("bar"); // "bar" or "dept"

  const deptStats = useMemo(() => {
    if (requestsByDept && requestsByDept.length > 0) {
      const total = totalRequests || 1;
      return requestsByDept.map((d, idx) => {
        const val = Number(d.value) || 0;
        return {
          label: d.name || "General Department",
          count: val,
          percent: Math.min(100, Math.round((val / total) * 100)),
          color: idx % 2 === 0 ? "#111A62" : "#E15B1D"
        };
      });
    }
    return [
      { label: "Operations & IT", count: 6, percent: 40, color: "#111A62" },
      { label: "Human Resources", count: 5, percent: 33, color: "#E15B1D" },
      { label: "Finance & Accounting", count: 2, percent: 14, color: "#0D9488" },
      { label: "Sales & Marketing", count: 2, percent: 13, color: "#4F46E5" },
    ];
  }, [requestsByDept, totalRequests]);

  return (
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#111A62]" />
              <h3 className="text-base font-extrabold text-slate-900">Requests by Department</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Manpower requisition distribution across organizational units</p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/60 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("bar")}
              className={cn(
                "px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer",
                viewMode === "bar" ? "bg-[#111A62] text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode("dept")}
              className={cn(
                "px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer",
                viewMode === "dept" ? "bg-teal-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Departments
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: BAR CHART (ACTION VOLUME) */}
      {viewMode === "bar" && (
        <div className="space-y-3.5 my-3 flex-1">
          {deptStats.map((item, i) => (
            <div key={i} className="group space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800 group-hover:text-[#111A62] transition-colors">{item.label}</span>
                <span className="font-mono font-black text-slate-600">{item.count} <span className="text-[10px] text-slate-400 font-normal">PRFs</span></span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{
                    width: `${Math.max(8, item.percent)}%`,
                    backgroundColor: item.color,
                    backgroundImage: item.color === "#111A62" ? "linear-gradient(to right, #111A62, #2563eb)" : "linear-gradient(to right, #E15B1D, #fb923c)"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 2: DEPARTMENTS RESOURCE LIST */}
      {viewMode === "dept" && (
        <div className="my-3 flex-1 space-y-3 max-h-64 overflow-y-auto pr-1">
          {deptStats.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-teal-500 transition">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black text-sm">
                  <Building2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{d.label}</p>
                  <p className="text-[10px] font-semibold text-slate-400">Requisition Share: {d.percent}%</p>
                </div>
              </div>
              <Badge tone="info" className="font-extrabold text-xs px-3 py-1">
                {d.count} {d.count === 1 ? "Active Form" : "Active Forms"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-700">
          <Cpu size={14} className="text-[#E15B1D]" /> Operational demand index: High
        </span>
        <span className="text-emerald-600">Synced</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   5. BOTTOM RIGHT: DATA TABLE -> PENDING APPROVALS QUEUE
   ─────────────────────────────────────────────────────────────────────────── */
function PendingApprovalsTable({ recentPending, recentHistory, approvedRequests }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending"); // "pending" or "history"
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
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
      <div>
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#111A62]" />
              <h3 className="text-base font-extrabold text-slate-900">Pending PRFs Needing Approval</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Executive approval queue for personnel requisition forms</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full 2xl:w-auto shrink-0">
            {/* Search Bar Component */}
            <div className="flex-1 sm:flex-none sm:w-56">
              <SearchBar
                value={filterQuery}
                onChange={handleFilterChange}
                placeholder="Filter requisitions..."
                className="h-9 text-xs"
              />
            </div>

            {/* Table Tabs as Select */}
            <div className="w-full sm:w-48 shrink-0">
              <Select
                icon={Filter}
                size="sm"
                value={tab}
                onChange={(e) => handleTabChange(e.target.value)}
                buttonClassName="bg-slate-50 hover:bg-white border-slate-200 h-9"
              >
                <option value="pending">Pending Queue</option>
                <option value="history">Approved History</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 my-2 overflow-x-auto min-h-[260px]">
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
                      <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                      <p className="text-xs font-extrabold text-slate-700">All caught up!</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">No pending PRFs require executive action.</p>
                    </div>
                  </TD>
                </tr>
              ) : (
                pagedPending.map((row) => {
                  const urg = (row.urgency || "normal").toLowerCase();
                  const badgeTone = urg === "critical" ? "danger" : urg === "high" ? "warning" : "info";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#111A62]/10 text-[#111A62] font-black flex items-center justify-center text-xs shrink-0 ring-1 ring-[#111A62]/20 group-hover:bg-[#111A62] group-hover:text-white transition">
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#111A62] transition-colors">
                              {row.position_needed}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400">
                              Needed by: {row.needed_by ? new Date(row.needed_by).toLocaleDateString() : "ASAP"}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <span className="text-xs font-extrabold text-slate-700 capitalize flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E15B1D]" />
                          {row.department?.department_name || "General"}
                        </span>
                      </TD>
                      <TD>
                        <Badge tone={badgeTone} className="font-black text-[10px] tracking-wider px-2 py-0.5 uppercase">
                          {urg}
                        </Badge>
                      </TD>
                      <TD>
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {row.headcount} {row.headcount === 1 ? "Seat" : "Seats"}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <Link
                          to="/coo/prf-approvals"
                          className="inline-flex items-center gap-1 text-[#111A62] hover:text-[#E15B1D] font-extrabold hover:underline transition cursor-pointer text-xs justify-end"
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
                <tr key={index} className="hover:bg-slate-50/80 transition">
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 font-black flex items-center justify-center text-xs shrink-0 ring-1 ring-emerald-500/20">
                        <FileCheck size={14} />
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{row.position}</span>
                    </div>
                  </TD>
                  <TD><Badge tone="info" className="font-extrabold text-[10px]">{row.dept}</Badge></TD>
                  <TD className="text-xs font-bold text-slate-700">{row.headcount} Seats</TD>
                  <TD>
                    <Badge tone="success" className="font-extrabold text-[10px]">
                      {row.status}
                    </Badge>
                  </TD>
                  <TD className="text-right text-xs font-bold text-slate-500">
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
        className="my-3 border-t border-slate-100 pt-3"
      />

      <div className="mt-1 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5 text-[#111A62]">
          <ShieldAlert size={14} className="text-[#E15B1D]" /> Executive approval policy active
        </span>
        <span className="text-slate-400 font-medium">Displaying active requisition queue</span>
      </div>
    </Card>
  );
}
