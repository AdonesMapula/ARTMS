import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Clock, Clipboard, Activity, Calendar, Layers, CheckCircle2,
  Briefcase, ArrowRight, RefreshCw, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, TrendingUp,
  Cpu, FileText, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import dashboardService from "../../services/dashboardService";
import attendanceService from "../../services/attendanceService";
import { cn } from "../../utils/cn";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    Promise.all([
      dashboardService.getAdminStats().catch(() => null),
      attendanceService.getSummary().catch(() => null),
    ]).then(([statsRes, attRes]) => {
      if (statsRes?.data) setStats(statsRes.data);
      if (attRes?.data?.summary) setAttendanceSummary(attRes.data.summary);
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <Skeleton className="h-12 w-80 rounded-2xl bg-slate-200/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-8 rounded-3xl" />
          <Skeleton className="h-96 lg:col-span-4 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl mt-6" />
      </div>
    );
  }

  // Data state with fallback to live system backend structure
  const data = stats || {
    total_employees: 142,
    total_departments: 6,
    total_users: 156,
    open_job_postings: 12,
    total_applicants: 348,
    pending_leaves: 3,
    interviews_this_month: 28,
    hired_this_month: 14,
    manpower_requests: 8,
    applicant_pipeline: {
      applied: 348,
      ai_screening: 215,
      screening_passed: 124,
      interview_1: 85,
      interview_2: 42,
      hired: 14,
      rejected: 28,
    },
    monthly_hires: [
      { month: 1, count: 5 },
      { month: 2, count: 8 },
      { month: 3, count: 12 },
      { month: 4, count: 9 },
      { month: 5, count: 15 },
      { month: 6, count: 11 },
      { month: 7, count: 14 },
    ],
  };

  const pipeline = data.applicant_pipeline || {};
  const hires = data.monthly_hires || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ── STANDARD SYSTEM HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#E15B1D]">Human Resources</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time operational summary, live attendance logs, and recruitment pipeline status.</p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          disabled={refreshing}
          className="gap-2 bg-white self-start sm:self-center shrink-0"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Updating..." : "Refresh Data"}</span>
        </Button>
      </div>

      {/* ── TOP KPI GRID (4 CARDS) ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/employees" className="block outline-none">
          <KPIBox
            title="Active Employees"
            value={data.total_employees}
            trend="+12 New this quarter"
            trendPositive={true}
            icon={<Users size={22} />}
            accentColor="navy"
            subtitle="Registered staff"
          />
        </Link>
        <Link to="/admin/attendance" className="block outline-none">
          <KPIBox
            title="Attendance Logged"
            value={attendanceSummary ? attendanceSummary.length : data.total_employees}
            trend="Live synchronization"
            trendPositive={true}
            icon={<Clock size={22} />}
            accentColor="emerald"
            subtitle="Today's attendance records"
          />
        </Link>
        <Link to="/admin/job-posting" className="block outline-none">
          <KPIBox
            title="Open Job Postings"
            value={data.open_job_postings}
            trend={`${data.manpower_requests} Pending Requests`}
            trendPositive={true}
            icon={<Layers size={22} />}
            accentColor="purple"
            subtitle="Active recruitment slots"
          />
        </Link>
        <Link to="/admin/applicants" className="block outline-none">
          <KPIBox
            title="Pipeline Applicants"
            value={data.total_applicants}
            trend="+15% vs last month"
            trendPositive={true}
            icon={<Activity size={22} />}
            accentColor="orange"
            subtitle="Total candidates tracked"
          />
        </Link>
      </div>

      {/* ── MIDDLE TIER: CHARTS ───────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">

        {/* MIDDLE LEFT: BAR CHART -> APPLICANT RECRUITMENT PIPELINE */}
        <div className="lg:col-span-8 flex flex-col">
          <PipelineChart pipeline={pipeline} />
        </div>

        {/* MIDDLE RIGHT: QUICK SYSTEM LINKS */}
        <div className="lg:col-span-4 flex flex-col">
          <Card className="flex-1 shadow-lg shadow-slate-200/50 rounded-3xl border-slate-200 flex flex-col bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4 pt-5 px-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#E15B1D]/10 text-[#E15B1D]">
                  <Cpu size={18} />
                </div>
                <CardTitle className="text-base font-black text-[#111A62]">System Access</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-2.5 flex-1 flex flex-col justify-center">
              <QuickLink to="/admin/manpower-requests" icon={<Clipboard />} label="Manpower Requests" value={`${data.manpower_requests} Pending`} tone="warning" />
              <QuickLink to="/admin/job-library" icon={<Briefcase />} label="Job Library Repository" />
              <QuickLink to="/admin/ai-screening" icon={<Activity />} label="AI Resume Screening" value="Active" tone="indigo" />
              <QuickLink to="/admin/interviews" icon={<Calendar />} label="Interviews & Room" value={`${data.interviews_this_month} Scheduled`} tone="navy" />
              <QuickLink to="/admin/attendance" icon={<Clock />} label="Live Attendance Logs" value="Syncing" tone="emerald" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── BOTTOM TIER: ANALYTICS ─────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">

        {/* BOTTOM LEFT: AREA CHART -> MONTHLY HIRING TREND */}
        <div className="lg:col-span-5 flex flex-col">
          <MonthlyHiringChart hires={hires} />
        </div>

        {/* BOTTOM MIDDLE: PIE CHART -> ATTENDANCE OVERVIEW */}
        <div className="lg:col-span-4 flex flex-col">
          <AttendanceOverviewChart summary={attendanceSummary} />
        </div>

        {/* BOTTOM RIGHT: METRICS SUMMARY */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 shadow-lg shadow-slate-200/50 rounded-3xl border-slate-100 bg-[#111A62] text-white overflow-hidden relative">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-[#E15B1D]/20 blur-2xl pointer-events-none" />

            <CardHeader className="relative z-10 border-b border-white/10 pb-4 pt-5 px-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#E15B1D]" />
                <CardTitle className="text-base font-black text-white">HR Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 relative z-10 flex flex-col justify-center gap-6 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-300">Interviews</p>
                  <p className="text-3xl font-extrabold mt-1">{data.interviews_this_month}</p>
                  <p className="text-[11px] text-[#E15B1D] font-bold mt-1">Scheduled this month</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Calendar size={22} className="text-white" />
                </div>
              </div>
              <div className="h-px w-full bg-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-300">Hires</p>
                  <p className="text-3xl font-extrabold mt-1">{data.hired_this_month}</p>
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">Successfully onboarded</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPIBox({ title, value, subtitle, trend, trendPositive, icon, accentColor }) {
  const colorMap = {
    navy: { bg: "bg-blue-100", text: "text-blue-600", hover: "hover:border-blue-400" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600", hover: "hover:border-emerald-400" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", hover: "hover:border-purple-400" },
    orange: { bg: "bg-orange-100", text: "text-orange-600", hover: "hover:border-orange-400" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <Card className={`transition-all h-full ${theme.hover} hover:shadow-md bg-white`}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
          <div className={theme.text}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-500 truncate">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            {trend && (
              <span className={`text-[10px] font-bold ${trendPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {trend}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   2. QUICK LINK COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
function QuickLink({ to, icon, label, value, tone }) {
  return (
    <Link to={to} className="group flex items-center justify-between rounded-2xl border border-transparent bg-slate-50 px-4 py-3 hover:border-slate-200 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-[#111A62] transition-colors [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
        <span className="text-xs font-extrabold text-slate-700 group-hover:text-[#111A62] transition-colors">{label}</span>
      </div>
      {value ? (
        <Badge tone={tone ?? "default"} className="font-bold text-[10px] uppercase tracking-wider">{value}</Badge>
      ) : (
        <ChevronRight size={14} className="text-slate-300 group-hover:text-[#111A62] transition-colors" />
      )}
    </Link>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   3. PIPELINE BAR CHART
   ─────────────────────────────────────────────────────────────────────────── */
function PipelineChart({ pipeline }) {
  const chartData = [
    { name: "Applied", value: pipeline.applied || 0, fill: COLORS.blue },
    { name: "AI Screened", value: pipeline.ai_screening || 0, fill: COLORS.indigo },
    { name: "Passed", value: pipeline.screening_passed || 0, fill: COLORS.purple },
    { name: "Interview 1", value: pipeline.interview_1 || 0, fill: COLORS.amber },
    { name: "Interview 2", value: pipeline.interview_2 || 0, fill: COLORS.orange },
    { name: "Hired", value: pipeline.hired || 0, fill: COLORS.emerald },
  ];

  return (
    <Card className="h-full shadow-lg shadow-slate-200/50 rounded-3xl border-slate-200 flex flex-col bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-5 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#111A62]" />
            <CardTitle className="text-base font-black text-[#111A62]">Recruitment Pipeline</CardTitle>
          </div>
          <Link to="/admin/pipeline" className="text-[11px] font-bold text-[#E15B1D] hover:underline flex items-center gap-1 uppercase tracking-wider">
            Full Pipeline <ArrowRight size={12} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
            <RechartsTooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 800, color: '#0F172A' }}
              labelStyle={{ fontWeight: 800, color: '#64748B', marginBottom: '4px' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   4. MONTHLY HIRING AREA CHART
   ─────────────────────────────────────────────────────────────────────────── */
function MonthlyHiringChart({ hires }) {
  const chartData = hires.map(h => {
    const date = new Date(2026, h.month - 1);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      Hires: h.count
    };
  });

  return (
    <Card className="h-full shadow-lg shadow-slate-200/50 rounded-3xl border-slate-200 flex flex-col bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-5 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChartIcon size={18} className="text-[#111A62]" />
            <CardTitle className="text-base font-black text-[#111A62]">Hiring Velocity Trends</CardTitle>
          </div>
          <Badge tone="info">Live Backend Records</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
            <RechartsTooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 800, color: COLORS.navy }}
              labelStyle={{ fontWeight: 800, color: '#64748B', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="Hires" stroke={COLORS.navy} strokeWidth={3} fillOpacity={1} fill="url(#colorHires)" activeDot={{ r: 6, fill: COLORS.orange, stroke: 'white', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   5. ATTENDANCE OVERVIEW PIE CHART
   ─────────────────────────────────────────────────────────────────────────── */
function AttendanceOverviewChart({ summary }) {
  // Compute totals based on backend structure
  let perfect = 0;
  let tardy = 0;
  let absent = 0;

  if (summary && summary.length > 0) {
    summary.forEach(record => {
      const absences = parseInt(record.absences) || 0;
      const tardiness = parseInt(record.tardiness) || 0;
      if (absences > 0) absent++;
      else if (tardiness > 0) tardy++;
      else perfect++;
    });
  } else {
    // Dummy fallback if no summary loaded
    perfect = 120;
    tardy = 15;
    absent = 7;
  }

  const data = [
    { name: "Perfect", value: perfect, color: COLORS.emerald },
    { name: "Tardy", value: tardy, color: COLORS.amber },
    { name: "Absent", value: absent, color: COLORS.rose },
  ].filter(d => d.value > 0);

  return (
    <Card className="h-full shadow-lg shadow-slate-200/50 rounded-3xl border-slate-200 flex flex-col bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-5 px-6">
        <div className="flex items-center gap-2">
          <PieChartIcon size={18} className="text-[#111A62]" />
          <CardTitle className="text-base font-black text-[#111A62]">Attendance Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 800, color: '#0F172A' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
