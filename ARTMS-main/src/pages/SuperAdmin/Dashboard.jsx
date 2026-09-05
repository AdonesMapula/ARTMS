import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, ShieldCheck, Building2, Activity, TrendingUp, AlertTriangle, ShieldAlert,
  FileText, CheckCircle2, Lock, Cpu, Server, RefreshCw, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Calendar, ChevronRight, Filter, Sparkles, Layers, ArrowUpRight, Clock, UserPlus, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import { Skeleton } from "../../components/ui/Skeleton";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
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
  blue: "#3B82F6",
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
      <div className="space-y-6 pb-12 animate-pulse">
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
    <div className="space-y-4 pb-8">
      {/* ── STANDARD SYSTEM HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-xs bg-slate-900 dark:bg-white" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Governance & Security
            </p>
          </div>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl transition-colors">
            Super Admin Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live system telemetry, security audit logs, and account governance.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer self-start sm:self-center shrink-0"
          title="Refresh Telemetry"
        >
          <RefreshCw size={13} className={cn(refreshing && "animate-spin text-slate-600 dark:text-slate-300")} />
          <span>{refreshing ? "Updating..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* ── TOP KPI GRID (4 CARDS) ────────────────────────────────────────────── */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <KPIBox
          title="Total Registered Users"
          value={totalUsers}
          icon={<Users size={18} />}
          accentColor="navy"
        />
        <KPIBox
          title="Active Sessions / Staff"
          value={activeUsers}
          icon={<ShieldCheck size={18} />}
          accentColor="orange"
        />
        <KPIBox
          title="Active Departments"
          value={departments.length}
          icon={<Building2 size={18} />}
          accentColor="teal"
        />
        <KPIBox
          title="Audit Telemetry Events"
          value={auditLogs.length || 248}
          icon={<Activity size={18} />}
          accentColor="indigo"
        />
      </div>

      {/* ── MIDDLE TIER: CHARTS (USER GROWTH AREA CHART + ROLE DONUT CHART) ───── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* MIDDLE LEFT: AREA / LINE CHART -> USER GROWTH & TRAFFIC TRENDS */}
        <div className="lg:col-span-7 flex flex-col">
          <TrafficTrendsChart totalUsers={totalUsers} trafficTrends={stats?.traffic_trends} />
        </div>

        {/* MIDDLE RIGHT: DONUT CHART -> STATUS BREAKDOWN / ROLE DISTRIBUTION */}
        <div className="lg:col-span-5 flex flex-col">
          <RoleDistributionChart usersByRole={usersByRole} totalUsers={totalUsers} inactiveUsers={stats?.inactive_users} deletedUsers={stats?.deleted_users} />
        </div>
      </div>

      {/* ── BOTTOM TIER: ANALYTICS & ACTIVITY TABLE ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* BOTTOM LEFT: BAR CHART / HEATMAP -> SECURITY AUDIT & SYSTEM LOGS */}
        <div className="lg:col-span-5 flex flex-col">
          <SecurityAuditChart logs={auditLogs} departments={departments} auditHeatmap={stats?.audit_heatmap} />
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
function KPIBox({ title, value, icon, accentColor }) {
  const colorMap = {
    navy: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/50",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/50",
    orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/50",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/50",
    teal: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-900/50",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50",
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3.5 shadow-2xs flex items-center gap-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md border", theme)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{title}</p>
        <p className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   2. MIDDLE LEFT: AREA / LINE CHART -> USER GROWTH & TRAFFIC TRENDS
   ─────────────────────────────────────────────────────────────────────────── */
const trafficChartConfig = {
  traffic: { label: "System Traffic & Requests", color: COLORS.navy },
  users: { label: "Active User Base", color: COLORS.orange },
};

function TrafficTrendsChart({ totalUsers, trafficTrends }) {
  const [timeRange, setTimeRange] = useState("7M"); // "7M", "30D", "24H"

  const chartData = useMemo(() => {
    if (trafficTrends && trafficTrends[timeRange]) {
      return trafficTrends[timeRange];
    }
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
  }, [timeRange, totalUsers, trafficTrends]);

  const maxTraffic = Math.max(...chartData.map(d => d.traffic), 10);
  const maxUsers = Math.max(...chartData.map(d => d.users), 10);

  return (
    <Card className="h-full shadow-2xs rounded-lg border-slate-200/80 dark:border-slate-800 flex flex-col bg-white dark:bg-[#0F163D] overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 py-3 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <LineChartIcon size={14} />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">User Growth & System Telemetry</CardTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dual-axis system workload and user sign-up trajectory</p>
          </div>
          
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md w-fit self-start sm:self-auto border border-slate-200/90 dark:border-slate-700">
            {["24H", "30D", "7M"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-sm transition-all duration-200 cursor-pointer",
                  timeRange === t ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {t === "7M" ? "Monthly" : t === "30D" ? "30 Days" : "Live (24h)"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3 mx-4 mt-3 p-2.5 rounded-md bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#111A62] shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Traffic</p>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">{maxTraffic.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ops</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#E15B1D] shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active User Base</p>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">{maxUsers.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">accounts</span></p>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-4 min-h-[260px]">
        <ChartContainer config={trafficChartConfig} className="h-full w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            
            <Area yAxisId="left" type="monotone" dataKey="traffic" name="Traffic" stroke={COLORS.navy} strokeWidth={2} fill="url(#colorTraffic)" activeDot={{ r: 5, fill: COLORS.navy, stroke: 'white', strokeWidth: 2 }} />
            <Area yAxisId="right" type="monotone" dataKey="users" name="Users" stroke={COLORS.orange} strokeWidth={2} fill="url(#colorUsers)" strokeDasharray="4 4" activeDot={{ r: 5, fill: COLORS.orange, stroke: 'white', strokeWidth: 2 }} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   3. MIDDLE RIGHT: DONUT CHART -> STATUS BREAKDOWN / ROLE DISTRIBUTION
   ─────────────────────────────────────────────────────────────────────────── */
function RoleDistributionChart({ usersByRole, totalUsers, inactiveUsers, deletedUsers }) {
  const [activeTab, setActiveTab] = useState("roles"); // "roles" or "status"

  const roleData = useMemo(() => {
    if (!usersByRole || usersByRole.length === 0) {
      return [
        { name: "Super Admin", count: 2, fill: ROLE_COLORS[0].hex },
        { name: "HR Admin", count: 5, fill: ROLE_COLORS[1].hex },
        { name: "Dept Head", count: 8, fill: ROLE_COLORS[2].hex },
        { name: "Employees / COO", count: 10, fill: ROLE_COLORS[3].hex },
      ];
    }
    return usersByRole.map((r, idx) => ({
      name: (r.role || "User").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      count: Number(r.count) || 0,
      fill: ROLE_COLORS[idx % ROLE_COLORS.length].hex,
    }));
  }, [usersByRole]);

  const statusData = useMemo(() => {
    const act = typeof inactiveUsers === 'number' ? (totalUsers - inactiveUsers) : 20;
    const idl = typeof inactiveUsers === 'number' ? inactiveUsers : 3;
    const rev = typeof deletedUsers === 'number' ? deletedUsers : 2;

    return [
      { name: "Active Verified", count: act, fill: "#10B981" },
      { name: "Pending Review", count: idl, fill: "#F59E0B" },
      { name: "Restricted / Offboarded", count: rev, fill: "#E11D48" },
    ];
  }, [totalUsers, inactiveUsers, deletedUsers]);

  const currentList = activeTab === "roles" ? roleData : statusData;
  
  // Create config for Shadcn Chart
  const chartConfig = useMemo(() => {
    const config = {};
    currentList.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [currentList]);

  const totalCount = currentList.reduce((acc, i) => acc + i.count, 0);

  return (
    <Card className="h-full shadow-2xs rounded-lg border-slate-200/80 dark:border-slate-800 flex flex-col bg-white dark:bg-[#0F163D] overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <PieChartIcon size={14} />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Role & Status Allocation</CardTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permission allocation breakdown</p>
          </div>

          <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/90 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab("roles")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer",
                activeTab === "roles" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer",
                activeTab === "status" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Status
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <ChartContainer config={chartConfig} className="w-full mx-auto aspect-square max-h-[190px] relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalCount || totalUsers}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {activeTab === "roles" ? "Total Roles" : "Accounts"}
              </span>
            </div>
            <PieChart>
              <Pie
                data={currentList}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="count"
                stroke="none"
              >
                {currentList.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            </PieChart>
          </ChartContainer>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {currentList.map((item, idx) => {
              const percent = totalCount ? Math.round((item.count / totalCount) * 100) : 0;
              return (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-default text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-xs shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 ml-2 font-mono">
                    <span className="text-[10px] text-slate-400">({item.count})</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   4. BOTTOM LEFT: BAR CHART -> SECURITY AUDIT & SYSTEM LOGS
   ─────────────────────────────────────────────────────────────────────────── */
function SecurityAuditChart({ logs, departments }) {
  const [viewMode, setViewMode] = useState("bar"); // "bar" (Actions), "dept" (Allocation)

  // Aggregate log actions or provide crisp defaults
  const actionStats = useMemo(() => {
    if (logs && logs.length > 0) {
      const counts = {};
      logs.forEach(l => {
        const act = (l.action || "ACCESS").toUpperCase().replace(/_/g, " ");
        counts[act] = (counts[act] || 0) + 1;
      });
      return Object.entries(counts).slice(0, 6).map(([label, count], idx) => ({
        label,
        count,
        fill: idx % 2 === 0 ? COLORS.navy : COLORS.orange
      }));
    }
    return [
      { label: "USER LOGIN / AUTH", count: 42, fill: COLORS.navy },
      { label: "PRF REQUISITION", count: 18, fill: COLORS.orange },
      { label: "201 FILE UPDATE", count: 24, fill: COLORS.navy },
      { label: "ROLE PERMISSION", count: 8, fill: COLORS.orange },
      { label: "REPORT EXPORT", count: 12, fill: COLORS.navy },
    ];
  }, [logs]);

  const auditConfig = {
    count: { label: "Events" },
  };

  return (
    <Card className="h-full rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 pb-3 pt-3.5 px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#111A62]/10 dark:bg-blue-900/30 text-[#111A62] dark:text-blue-300">
                <BarChart3 size={15} />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Security Audit & Logs</CardTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Telemetry action frequency and load</p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("bar")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer",
                viewMode === "bar" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Action Volume
            </button>
            <button
              onClick={() => setViewMode("dept")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer",
                viewMode === "dept" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Departments
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-5 min-h-[300px]">
        {viewMode === "bar" ? (
          <ChartContainer config={auditConfig} className="h-full w-full">
            <BarChart data={actionStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                dy={10}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
              />
              <ChartTooltip cursor={{ fill: 'currentColor', className: 'text-slate-100 dark:text-slate-800/40' }} content={<ChartTooltipContent nameKey="label" />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex-1 space-y-2 max-h-64 overflow-y-auto pr-1">
            {departments.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No departments established yet.</p>
            ) : (
              departments.map((d) => {
                const count = d.employees_count || 0;
                return (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs">
                        <Building2 size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200">{d.department_name}</p>
                        <p className="text-[10px] font-mono text-slate-400">DEPT-{String(d.id).padStart(2, "0")}</p>
                      </div>
                    </div>
                    <Badge tone={d.is_active ? "success" : "default"} className="font-semibold text-xs px-2.5 py-0.5">
                      {count} {count === 1 ? "Staff Member" : "Staff Members"}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
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
    <Card className="h-full rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 pb-3 pt-3.5 px-4 sm:px-5">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#111A62]/10 dark:bg-blue-900/30 text-[#111A62] dark:text-blue-300">
                <Layers size={15} />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Critical Activity & Governance</CardTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live security events, account authorizations, and RBAC telemetry</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full 2xl:w-auto shrink-0">
            <div className="flex-1 sm:flex-none sm:w-56">
              <SearchBar
                value={filterQuery}
                onChange={handleFilterChange}
                placeholder="Filter logs or users..."
                className="h-8.5 text-xs"
              />
            </div>

            <div className="w-full sm:w-48 shrink-0">
              <Select
                icon={Filter}
                size="sm"
                value={tab}
                onChange={(e) => handleTabChange(e.target.value)}
                buttonClassName="bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700 h-8.5 text-xs"
              >
                <option value="audit">Security Audit Logs</option>
                <option value="signups">Recent Accounts</option>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* TABLE SECTION */}
      <CardContent className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-h-[300px]">
        <div className="flex-1 overflow-x-auto">
          {tab === "audit" ? (
            <Table>
              <THead>
                <tr>
                  <TH>Authorized Identity</TH>
                  <TH>Action Executed</TH>
                  <TH>Module Area</TH>
                  <TH>Client IP</TH>
                  <TH className="text-right">Timestamp</TH>
                </tr>
              </THead>
              <tbody>
                {pagedAuditLogs.length === 0 ? (
                  <tr>
                    <TD colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No critical security logs match filter query.
                    </TD>
                  </tr>
                ) : (
                  pagedAuditLogs.map((log) => {
                    const actionStr = (log.action || "LOG_EVENT").toUpperCase().replace(/_/g, " ");
                    const isCrit = actionStr.includes("DELETE") || actionStr.includes("EXPORT") || actionStr.includes("SUPERADMIN") || actionStr.includes("ROLE");
                    const badgeTone = log.tone || (isCrit ? "warning" : "info");

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md bg-[#111A62]/10 dark:bg-blue-900/30 text-[#111A62] dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-[#111A62]/20 group-hover:bg-[#111A62] group-hover:text-white transition">
                              {(log.user?.email || log.user?.name || "S")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 group-hover:text-[#111A62] dark:group-hover:text-blue-400 transition-colors">
                                {log.user?.name || log.user?.email?.split("@")[0] || "System Daemon"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {log.user?.email || "system.daemon@artms.core"}
                              </p>
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <Badge tone={badgeTone} className="font-mono text-[10px] uppercase px-1.5 py-0.5">
                            {actionStr}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#E15B1D]" />
                            {log.module || "General Systems"}
                          </span>
                        </TD>
                        <TD>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                            {log.ip_address || "127.0.0.1"}
                          </span>
                        </TD>
                        <TD className="text-right">
                          <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                            {new Date(log.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
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
            <Table>
              <THead>
                <tr>
                  <TH>Account Applicant</TH>
                  <TH>Department Tag</TH>
                  <TH>Clearance Level</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Action</TH>
                </tr>
              </THead>
              <tbody>
                {pagedSignups.length === 0 ? (
                  <tr>
                    <TD colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No recent user accounts found matching query.
                    </TD>
                  </tr>
                ) : (
                  pagedSignups.map((u) => {
                    const roleLabel = (u.role || "user").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                    const displayName = u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md bg-[#E15B1D]/10 text-[#E15B1D] font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-[#E15B1D]/20">
                              <UserPlus size={13} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">{displayName}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <Badge tone="info" className="text-[10px]">
                            {u.department?.department_name || "General Systems"}
                          </Badge>
                        </TD>
                        <TD className="text-xs font-medium text-slate-700 dark:text-slate-300">{roleLabel}</TD>
                        <TD>
                          <Badge tone={u.is_active ? "success" : "warning"} className="text-[10px]">
                            {u.is_active ? "Active Verified" : "Pending Review"}
                          </Badge>
                        </TD>
                        <TD className="text-right text-xs">
                          <Link to="/super-admin/users" className="text-[#111A62] dark:text-blue-400 hover:text-[#E15B1D] font-semibold hover:underline transition cursor-pointer text-xs inline-flex items-center gap-1 justify-end">
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
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={setPage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
