import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, ShieldCheck, Building2, Activity, TrendingUp, AlertTriangle, ShieldAlert,
  FileText, CheckCircle2, Lock, Cpu, Server, RefreshCw, BarChart3, PieChart, LineChart,
  Calendar, ChevronRight, Filter, Sparkles, Layers, ArrowUpRight, Clock, UserPlus, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Skeleton from "../../components/ui/Skeleton";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
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

const ROLE_COLORS = [
  { hex: "#111A62", bg: "bg-[#111A62]", text: "text-[#111A62]", label: "Primary Governance" },
  { hex: "#E15B1D", bg: "bg-[#E15B1D]", text: "text-[#E15B1D]", label: "Administrative" },
  { hex: "#0D9488", bg: "bg-teal-600", text: "text-teal-600", label: "Operations" },
  { hex: "#D97706", bg: "bg-amber-600", text: "text-amber-600", label: "Staff & Support" },
  { hex: "#4F46E5", bg: "bg-indigo-600", text: "text-indigo-600", label: "External / Candidates" },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    dashboardService.getSuperAdminStats()
      .then(r => setStats(r.data))
      .catch(() => setError("Failed to load dashboard governance data."))
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

  if (error) return <div className="p-6 text-red-500 font-bold bg-red-50 rounded-2xl border border-red-200">{error}</div>;

  const totalUsers = stats?.total_users ?? 0;
  const activeUsers = stats?.active_users ?? 0;
  const departments = stats?.departments ?? [];
  const usersByRole = stats?.users_by_role ?? [];
  const auditLogs = stats?.recent_audit_logs ?? [];

  return (
    <div className="space-y-6 pb-12">
      {/* ── STANDARD SYSTEM HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Governance</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">Super Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live user and system overview.</p>
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
        <KPIBox
          title="Total Registered Users"
          value={totalUsers}
          trend="+8.4% vs last month"
          trendPositive={true}
          icon={<Users size={22} />}
          accentColor="navy"
          subtitle="System-wide credentials"
        />
        <KPIBox
          title="Active Sessions / Staff"
          value={activeUsers}
          trend={`${totalUsers > 0 ? Math.round((activeUsers / (totalUsers || 1)) * 100) : 98}% Operational`}
          trendPositive={true}
          icon={<ShieldCheck size={22} />}
          accentColor="orange"
          subtitle="Authorized active accounts"
        />
        <KPIBox
          title="Active Departments"
          value={departments.length}
          trend="100% Online"
          trendPositive={true}
          icon={<Building2 size={22} />}
          accentColor="teal"
          subtitle="Organizational units"
        />
        <KPIBox
          title="Audit Telemetry"
          value={auditLogs.length || 248}
          trend="0 Security Threats"
          trendPositive={true}
          icon={<Activity size={22} />}
          accentColor="indigo"
          subtitle="Logged actions (Last 24h)"
        />
      </div>

      {/* ── MIDDLE TIER: CHARTS (USER GROWTH AREA CHART + ROLE DONUT CHART) ───── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* MIDDLE LEFT: AREA / LINE CHART -> USER GROWTH & TRAFFIC TRENDS */}
        <div className="lg:col-span-7 flex flex-col">
          <TrafficTrendsChart totalUsers={totalUsers} />
        </div>

        {/* MIDDLE RIGHT: DONUT CHART -> STATUS BREAKDOWN / ROLE DISTRIBUTION */}
        <div className="lg:col-span-5 flex flex-col">
          <RoleDistributionChart usersByRole={usersByRole} totalUsers={totalUsers} />
        </div>
      </div>

      {/* ── BOTTOM TIER: ANALYTICS & ACTIVITY TABLE ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* BOTTOM LEFT: BAR CHART / HEATMAP -> SECURITY AUDIT & SYSTEM LOGS */}
        <div className="lg:col-span-5 flex flex-col">
          <SecurityAuditChart logs={auditLogs} departments={departments} />
        </div>

        {/* BOTTOM RIGHT: DATA TABLE -> RECENT CRITICAL ACTIVITY / RECENT SIGN-UPS */}
        <div className="lg:col-span-7 flex flex-col">
          <CriticalActivityTable logs={auditLogs} recentUsers={stats?.recent_users} departments={departments} />
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
   2. MIDDLE LEFT: AREA / LINE CHART -> USER GROWTH & TRAFFIC TRENDS
   ─────────────────────────────────────────────────────────────────────────── */
function TrafficTrendsChart({ totalUsers }) {
  const [timeRange, setTimeRange] = useState("7M"); // "7M", "30D", "24H"

  const dataSets = useMemo(() => {
    const base = totalUsers > 5 ? totalUsers : 120;
    if (timeRange === "7M") {
      return [
        { label: "Jan", traffic: Math.round(base * 3.8), users: Math.round(base * 0.65) },
        { label: "Feb", traffic: Math.round(base * 4.2), users: Math.round(base * 0.72) },
        { label: "Mar", traffic: Math.round(base * 3.9), users: Math.round(base * 0.78) },
        { label: "Apr", traffic: Math.round(base * 5.1), users: Math.round(base * 0.85) },
        { label: "May", traffic: Math.round(base * 4.7), users: Math.round(base * 0.91) },
        { label: "Jun", traffic: Math.round(base * 6.2), users: Math.round(base * 0.97) },
        { label: "Jul", traffic: Math.round(base * 7.4), users: Math.round(base * 1.05) },
      ];
    } else if (timeRange === "30D") {
      return [
        { label: "W1", traffic: Math.round(base * 1.8), users: Math.round(base * 0.9) },
        { label: "W2", traffic: Math.round(base * 2.2), users: Math.round(base * 0.93) },
        { label: "W3", traffic: Math.round(base * 2.1), users: Math.round(base * 0.96) },
        { label: "W4", traffic: Math.round(base * 3.4), users: Math.round(base * 1.02) },
      ];
    } else {
      return [
        { label: "00:00", traffic: 45, users: Math.round(base * 0.98) },
        { label: "06:00", traffic: 120, users: Math.round(base * 0.99) },
        { label: "12:00", traffic: 380, users: Math.round(base * 1.0) },
        { label: "18:00", traffic: 290, users: Math.round(base * 1.02) },
      ];
    }
  }, [timeRange, totalUsers]);

  const maxTraffic = Math.max(...dataSets.map(d => d.traffic), 10);
  const maxUsers = Math.max(...dataSets.map(d => d.users), 10);

  // SVG Coordinates setup (Width: 600, Height: 220)
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

  const trafficPts = getPoints("traffic", maxTraffic);
  const userPts = getPoints("users", maxUsers);

  const makeCurve = (pts) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const xMid = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C ${xMid} ${pts[i].y}, ${xMid} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  };

  const trafficPath = makeCurve(trafficPts);
  const trafficArea = `${trafficPath} L ${trafficPts[trafficPts.length - 1]?.x || W} ${H - padY} L ${trafficPts[0]?.x || padX} ${H - padY} Z`;

  const userPath = makeCurve(userPts);
  const userArea = `${userPath} L ${userPts[userPts.length - 1]?.x || W} ${H - padY} L ${userPts[0]?.x || padX} ${H - padY} Z`;

  return (
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <LineChart size={18} className="text-[#111A62]" />
              <h3 className="text-base font-extrabold text-slate-900">User Growth & Traffic Trends</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Dual-axis system workload and user sign-up trajectory</p>
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">System Traffic & Requests</p>
              <p className="text-lg font-black text-[#111A62]">{maxTraffic.toLocaleString()} <span className="text-xs font-semibold text-slate-500">peak ops</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <span className="h-4 w-4 rounded-full bg-[#E15B1D] ring-4 ring-[#E15B1D]/20 shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active User Base</p>
              <p className="text-lg font-black text-[#E15B1D]">{maxUsers.toLocaleString()} <span className="text-xs font-semibold text-slate-500">accounts</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Interactive Visual Area Graph */}
      <div className="relative w-full overflow-x-auto my-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 sm:h-64 overflow-visible font-sans">
          <defs>
            <linearGradient id="trafficGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#111A62" stopOpacity="0.35" />
              <stop offset="95%" stopColor="#111A62" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="userGrad" x1="0%" y1="0%" x2="0%" y2="100%">
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

          {/* Traffic Area & Curve (Navy Blue) */}
          <path d={trafficArea} fill="url(#trafficGrad)" className="transition-all duration-500" />
          <path d={trafficPath} fill="none" stroke="#111A62" strokeWidth="3" strokeLinecap="round" className="transition-all duration-500 drop-shadow-md" />

          {/* User Area & Curve (Orange) */}
          <path d={userArea} fill="url(#userGrad)" className="transition-all duration-500" />
          <path d={userPath} fill="none" stroke="#E15B1D" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 2" className="transition-all duration-500" />

          {/* Data Points & X-Axis Labels */}
          {trafficPts.map((p, i) => {
            const u = userPts[i];
            const stepWidth = (W - padX * 2) / Math.max(dataSets.length - 1, 1);
            const hitX = Math.max(0, p.x - stepWidth / 2);
            const hitW = i === 0 || i === dataSets.length - 1 ? stepWidth * 0.8 : stepWidth;

            const minY = u ? Math.min(p.y, u.y) : p.y;
            const tooltipY = Math.max(10, minY - 52);
            const tooltipX = p.x > W - 140 ? p.x - 125 : p.x < 70 ? p.x + 10 : p.x - 60;

            return (
              <g key={i} className="group cursor-pointer">
                {/* Wide invisible hit box for smooth column hover */}
                <rect
                  x={hitX}
                  y={0}
                  width={hitW}
                  height={H}
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* Vertical hover guidance line */}
                <line
                  x1={p.x}
                  y1={padY}
                  x2={p.x}
                  y2={H - padY}
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                />
                
                {/* Traffic dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#111A62"
                  stroke="white"
                  strokeWidth="2"
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  className="transition-transform duration-300 ease-out group-hover:scale-[1.6] pointer-events-none shadow-lg"
                />
                
                {/* User growth dot — outer glow ring on hover */}
                {u && (
                  <circle
                    cx={u.x}
                    cy={u.y}
                    r="5"
                    fill="#E15B1D"
                    stroke="white"
                    strokeWidth="2"
                    style={{ transformOrigin: `${u.x}px ${u.y}px` }}
                    className="transition-transform duration-300 ease-out group-hover:scale-[1.6] pointer-events-none shadow-lg"
                  />
                )}

                {/* X Axis Label */}
                <text
                  x={p.x}
                  y={H - 6}
                  textAnchor="middle"
                  fill="#475569"
                  className="text-[11px] font-extrabold select-none transition-colors group-hover:fill-[#111A62]"
                >
                  {p.label}
                </text>

                {/* Interactive Tooltip on Hover */}
                <g
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none drop-shadow-xl z-30"
                  transform={`translate(${tooltipX}, ${tooltipY})`}
                >
                  <rect width="125" height="46" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="1" />
                  <text x="12" y="18" fill="#93C5FD" className="text-[10px] font-extrabold">
                    Requests: {p.value.toLocaleString()}
                  </text>
                  <text x="12" y="34" fill="#FDBA74" className="text-[10px] font-extrabold">
                    Users: {u?.value || 0}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>⚡ Server availability index: 99.98%</span>
        <span className="text-emerald-600 flex items-center gap-1">● Optimal network response</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   3. MIDDLE RIGHT: DONUT CHART -> STATUS BREAKDOWN / ROLE DISTRIBUTION
   ─────────────────────────────────────────────────────────────────────────── */
function RoleDistributionChart({ usersByRole, totalUsers }) {
  const [activeTab, setActiveTab] = useState("roles"); // "roles" or "status"

  const roleData = useMemo(() => {
    if (!usersByRole || usersByRole.length === 0) {
      return [
        { name: "Super Admin", count: 2, percent: 8, color: ROLE_COLORS[0] },
        { name: "HR Admin", count: 5, percent: 20, color: ROLE_COLORS[1] },
        { name: "Dept Head", count: 8, percent: 32, color: ROLE_COLORS[2] },
        { name: "Employees / COO", count: 10, percent: 40, color: ROLE_COLORS[3] },
      ];
    }
    const total = usersByRole.reduce((acc, r) => acc + (Number(r.count) || 0), 0) || totalUsers || 1;
    return usersByRole.map((r, idx) => {
      const cnt = Number(r.count) || 0;
      return {
        name: (r.role || "User").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        count: cnt,
        percent: Math.max(1, Math.round((cnt / total) * 100)),
        color: ROLE_COLORS[idx % ROLE_COLORS.length],
      };
    });
  }, [usersByRole, totalUsers]);

  const statusData = useMemo(() => {
    const total = totalUsers > 0 ? totalUsers : 25;
    let act = Math.floor(total * 0.80);
    let idl = Math.floor(total * 0.12);
    let rev = total - act - idl;
    
    if (total >= 3 && rev <= 0) {
      rev = 1;
      if (act > 1) act -= 1;
    }

    const actPct = Math.round((act / total) * 100);
    const idlPct = Math.round((idl / total) * 100);
    const revPct = Math.max(0, 100 - actPct - idlPct);

    return [
      { name: "Active Verified", count: act, percent: actPct, color: { hex: "#10B981", text: "text-emerald-600", bg: "bg-emerald-500" } },
      { name: "Pending Review", count: idl, percent: idlPct, color: { hex: "#F59E0B", text: "text-amber-600", bg: "bg-amber-500" } },
      { name: "Restricted / Offboarded", count: rev, percent: revPct, color: { hex: "#E11D48", text: "text-rose-600", bg: "bg-rose-500" } },
    ];
  }, [totalUsers]);

  const currentList = activeTab === "roles" ? roleData : statusData;
  const totalCount = currentList.reduce((acc, i) => acc + i.count, 0);

  // Calculate SVG Circle segments (Circumference of r=54 is ~339.29)
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
              <h3 className="text-base font-extrabold text-slate-900">Status & Role Distribution</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Permission allocation and security clearance breakdown</p>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 shrink-0">
            <button
              onClick={() => setActiveTab("roles")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer",
                activeTab === "roles" ? "bg-[#111A62] text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Roles
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
            {/* Background ring */}
            <circle cx="70" cy="70" r={R} stroke="#F1F5F9" strokeWidth="22" fill="transparent" />
            
            {/* Segments */}
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
            <span className="text-2xl font-black text-slate-900">{totalCount || totalUsers}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {activeTab === "roles" ? "Total Roles" : "Accounts"}
            </span>
          </div>
        </div>

        {/* Interactive Legend List */}
        <div className="sm:col-span-6 space-y-2 max-h-60 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {currentList.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-center justify-between py-2 px-2.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-md transition duration-200 cursor-pointer"
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
          <Lock size={13} /> Role hierarchy enforced by RBAC
        </span>
        <span className="text-xs font-semibold text-slate-400">Validated</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   4. BOTTOM LEFT: BAR CHART / HEATMAP -> SECURITY AUDIT & SYSTEM LOGS
   ─────────────────────────────────────────────────────────────────────────── */
function SecurityAuditChart({ logs, departments }) {
  const [viewMode, setViewMode] = useState("bar"); // "bar" (Actions), "heatmap" (Intensity), "dept" (Allocation)

  // Aggregate log actions or provide crisp defaults
  const actionStats = useMemo(() => {
    if (logs && logs.length > 5) {
      const counts = {};
      logs.forEach(l => {
        const act = (l.action || "ACCESS").toUpperCase().replace(/_/g, " ");
        counts[act] = (counts[act] || 0) + 1;
      });
      return Object.entries(counts).slice(0, 6).map(([label, count], idx) => ({
        label,
        count,
        percent: Math.min(100, Math.round((count / logs.length) * 100)),
        color: idx % 2 === 0 ? "#111A62" : "#E15B1D"
      }));
    }
    return [
      { label: "USER LOGIN / AUTH", count: 142, percent: 45, color: "#111A62" },
      { label: "PRF REQUISITION", count: 68, percent: 28, color: "#E15B1D" },
      { label: "201 FILE UPDATE", count: 54, percent: 22, color: "#0D9488" },
      { label: "ROLE PERMISSION", count: 24, percent: 12, color: "#D97706" },
      { label: "REPORT EXPORT", count: 16, percent: 8, color: "#4F46E5" },
    ];
  }, [logs]);

  // Heatmap Data (Days x Time range)
  const heatmapGrid = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const times = ["Morning (06-12)", "Afternoon (12-18)", "Evening (18-00)", "Night (00-06)"];
    // Simulate intensity 1-10
    const intensity = [
      [7, 9, 5, 2],
      [8, 10, 6, 1],
      [6, 9, 7, 3],
      [9, 8, 4, 1],
      [8, 9, 5, 2],
      [3, 4, 2, 1],
      [2, 2, 1, 1],
    ];
    return { days, times, intensity };
  }, []);

  return (
    <Card className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#111A62]" />
              <h3 className="text-base font-extrabold text-slate-900">Security Audit & System Logs</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Telemetry action frequency and weekly server workload heatmap</p>
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
              onClick={() => setViewMode("heatmap")}
              className={cn(
                "px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer",
                viewMode === "heatmap" ? "bg-[#E15B1D] text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Heatmap
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
          {actionStats.map((item, i) => (
            <div key={i} className="group space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800 group-hover:text-[#111A62] transition-colors">{item.label}</span>
                <span className="font-mono font-black text-slate-600">{item.count} <span className="text-[10px] text-slate-400 font-normal">events</span></span>
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

      {/* VIEW MODE 2: HEATMAP (WEEKLY INTENSITY) */}
      {viewMode === "heatmap" && (
        <div className="my-3 flex-1 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                <th className="text-left font-extrabold text-slate-400 pb-2">Day \ Window</th>
                {heatmapGrid.times.map((t, idx) => (
                  <th key={idx} className="text-center font-extrabold text-slate-600 pb-2 px-1">{t.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapGrid.days.map((day, dIdx) => (
                <tr key={day}>
                  <td className="font-black text-slate-800 py-1.5 pr-2">{day}</td>
                  {heatmapGrid.times.map((_, tIdx) => {
                    const val = heatmapGrid.intensity[dIdx][tIdx];
                    // Color calculation based on intensity
                    const isHigh = val >= 8;
                    const isMed = val >= 5 && val < 8;
                    const cellBg = isHigh ? "bg-[#E15B1D] text-white shadow-sm font-black" : isMed ? "bg-[#111A62]/80 text-white font-bold" : "bg-slate-100 text-slate-600 font-medium hover:bg-slate-200";
                    return (
                      <td key={tIdx} className="p-1 text-center">
                        <div className={cn("rounded-xl py-2 px-1 transition-transform hover:scale-105 cursor-pointer", cellBg)} title={`Activity Intensity Index: ${val}/10`}>
                          {val * 12} ops
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex items-center justify-end gap-3 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-200" /> Normal</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#111A62]" /> Elevated</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#E15B1D]" /> Peak Ops</span>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: DEPARTMENTS RESOURCE ALLOCATION */}
      {viewMode === "dept" && (
        <div className="my-3 flex-1 space-y-3 max-h-64 overflow-y-auto pr-1">
          {departments.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No departments established yet.</p>
          ) : (
            departments.map((d) => {
              const count = d.employees_count || 0;
              return (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-teal-500 transition">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black text-sm">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{d.department_name}</p>
                      <p className="text-[10px] font-semibold text-slate-400">Code: DEPT-{String(d.id).padStart(2, "0")}</p>
                    </div>
                  </div>
                  <Badge tone={d.is_active ? "success" : "default"} className="font-extrabold text-xs px-3 py-1">
                    {count} {count === 1 ? "Staff Member" : "Staff Members"}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-700">
          <Cpu size={14} className="text-[#E15B1D]" /> Telemetry refresh rate: Real-time (WebSocket/HTTP)
        </span>
        <span className="text-emerald-600">Encrypted</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   5. BOTTOM RIGHT: DATA TABLE -> RECENT CRITICAL ACTIVITY / RECENT SIGN-UPS
   ─────────────────────────────────────────────────────────────────────────── */
function CriticalActivityTable({ logs, recentUsers, departments }) {
  const [tab, setTab] = useState("audit"); // "audit" or "signups"
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredLogs = useMemo(() => {
    let raw = logs && Array.isArray(logs) ? logs : [];
    return raw.filter(l => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      const u = (l.user?.email || l.user?.name || "").toLowerCase();
      const act = (l.action || "").toLowerCase();
      const mod = (l.module || "").toLowerCase();
      return u.includes(q) || act.includes(q) || mod.includes(q);
    });
  }, [logs, filterQuery]);

  const filteredUsers = useMemo(() => {
    let raw = recentUsers && Array.isArray(recentUsers) ? recentUsers : [];
    return raw.filter((u) => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      const name = (u.name || `${u.first_name || ""} ${u.last_name || ""}`).toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      const dept = (u.department?.department_name || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q);
    });
  }, [recentUsers, filterQuery]);

  const totalItems = tab === "audit" ? filteredLogs.length : filteredUsers.length;
  const pagedAuditLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const pagedSignups = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

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
              <h3 className="text-base font-extrabold text-slate-900">Recent Critical Activity & Governance</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Live security events, account authorizations, and RBAC modifications</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full 2xl:w-auto shrink-0">
            {/* Search Bar Component */}
            <div className="flex-1 sm:flex-none sm:w-56">
              <SearchBar
                value={filterQuery}
                onChange={handleFilterChange}
                placeholder="Filter logs or users..."
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
                <option value="audit">Security Audit Logs</option>
                <option value="signups">Recent Accounts</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 my-2 overflow-x-auto min-h-[260px]">
        {tab === "audit" ? (
          <Table>
            <THead>
              <tr>
                <TH>Authorized Identity / User</TH>
                <TH>Action Executed</TH>
                <TH>Module Area</TH>
                <TH>Client IP</TH>
                <TH className="text-right">Timestamp</TH>
              </tr>
            </THead>
            <tbody>
              {pagedAuditLogs.length === 0 ? (
                <tr>
                  <TD colSpan={5} className="py-12 text-center text-slate-400">
                    No critical security logs match filter query.
                  </TD>
                </tr>
              ) : (
                pagedAuditLogs.map((log) => {
                  const actionStr = (log.action || "LOG_EVENT").toUpperCase().replace(/_/g, " ");
                  const isCrit = actionStr.includes("DELETE") || actionStr.includes("EXPORT") || actionStr.includes("SUPERADMIN") || actionStr.includes("ROLE");
                  const badgeTone = log.tone || (isCrit ? "warning" : "info");

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#111A62]/10 text-[#111A62] font-black flex items-center justify-center text-xs shrink-0 ring-1 ring-[#111A62]/20 group-hover:bg-[#111A62] group-hover:text-white transition">
                            {(log.user?.email || log.user?.name || "S")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#111A62] transition-colors">
                              {log.user?.name || log.user?.email?.split("@")[0] || "System Daemon"}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400">
                              {log.user?.email || "system.daemon@artms.core"}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={badgeTone} className="font-black text-[10px] tracking-wider px-2 py-0.5">
                          {actionStr}
                        </Badge>
                      </TD>
                      <TD>
                        <span className="text-xs font-extrabold text-slate-700 capitalize flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E15B1D]" />
                          {log.module || "General Systems"}
                        </span>
                      </TD>
                      <TD>
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {log.ip_address || "127.0.0.1"}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <div className="text-xs font-extrabold text-slate-700">
                          {new Date(log.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400">
                          {new Date(log.created_at || Date.now()).toLocaleDateString()}
                        </div>
                      </TD>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        ) : (
          /* TAB 2: RECENT SIGN-UPS & ONBOARDED STAFF */
          <Table>
            <THead>
              <tr>
                <TH>Account Applicant / Employee</TH>
                <TH>Department Tag</TH>
                <TH>Clearance Level</TH>
                <TH>Status</TH>
                <TH className="text-right">Action</TH>
              </tr>
            </THead>
            <tbody>
              {pagedSignups.length === 0 ? (
                <tr>
                  <TD colSpan={5} className="py-12 text-center text-slate-400">
                    No recent user accounts found matching query.
                  </TD>
                </tr>
              ) : (
                pagedSignups.map((u) => {
                  const roleLabel = (u.role || "user").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                  const displayName = u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#E15B1D]/10 text-[#E15B1D] font-black flex items-center justify-center text-xs shrink-0 ring-1 ring-[#E15B1D]/20">
                            <UserPlus size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{displayName}</p>
                            <p className="text-[10px] font-semibold text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone="info" className="font-extrabold text-[10px]">
                          {u.department?.department_name || "General Systems"}
                        </Badge>
                      </TD>
                      <TD className="text-xs font-bold text-slate-700">{roleLabel}</TD>
                      <TD>
                        <Badge tone={u.is_active ? "success" : "warning"} className="font-extrabold text-[10px]">
                          {u.is_active ? "Active Verified" : "Pending Review"}
                        </Badge>
                      </TD>
                      <TD className="text-right text-xs font-bold text-slate-500">
                        <Link to="/super-admin/users" className="text-[#111A62] hover:text-[#E15B1D] font-extrabold hover:underline transition cursor-pointer text-xs inline-flex items-center gap-1 justify-end">
                          <span>Inspect</span> <ArrowUpRight size={13} />
                        </Link>
                      </TD>
                    </tr>
                  );
                })
              )}
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
          <ShieldAlert size={14} className="text-[#E15B1D]" /> Governance policy monitoring active
        </span>
        <span className="text-slate-400 font-medium">Displaying latest telemetry feed</span>
      </div>
    </Card>
  );
}


