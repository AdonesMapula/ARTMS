import { useEffect, useState } from "react";
import {
  FiClock,
  FiUserCheck,
  FiAlertCircle,
  FiUserX,
  FiSearch,
  FiCalendar,
  FiPlus,
  FiEdit,
  FiDownload,
  FiFilter,
  FiFileText,
  FiUser,
  FiCheckCircle,
  FiX,
  FiEye,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import { Table, THead, TH, TD } from "../../components/ui/Table";
import attendanceService from "../../services/attendanceService";
import employeeService from "../../services/employeeService";

// Fallback Mock Attendance Logs
const MOCK_ATTENDANCE_LOGS = [
  {
    id: 1,
    employee_id: 1,
    employee_number: "EMP-2024-001",
    employee_name: "John Doe",
    department: "Human Resources",
    position: "HR Specialist",
    date: new Date().toISOString().split("T")[0],
    time_in: "08:00",
    time_out: "17:00",
    status: "present",
    late_minutes: 0,
    hours_worked: 8.0,
    remarks: "On time",
  },
  {
    id: 2,
    employee_id: 2,
    employee_number: "EMP-2024-002",
    employee_name: "Jane Smith",
    department: "Information Technology",
    position: "Senior Software Engineer",
    date: new Date().toISOString().split("T")[0],
    time_in: "08:25",
    time_out: "17:30",
    status: "late",
    late_minutes: 25,
    hours_worked: 8.0,
    remarks: "Traffic along EDSA",
  },
  {
    id: 3,
    employee_id: 3,
    employee_number: "EMP-2024-003",
    employee_name: "Alex Johnson",
    department: "Finance",
    position: "Financial Analyst",
    date: new Date().toISOString().split("T")[0],
    time_in: "07:55",
    time_out: "17:05",
    status: "present",
    late_minutes: 0,
    hours_worked: 8.1,
    remarks: "Early bird",
  },
  {
    id: 4,
    employee_id: 4,
    employee_number: "EMP-2024-004",
    employee_name: "Maria Santos",
    department: "Operations",
    position: "Operations Supervisor",
    date: new Date().toISOString().split("T")[0],
    time_in: null,
    time_out: null,
    status: "on_leave",
    late_minutes: 0,
    hours_worked: 0,
    remarks: "Sick Leave approved",
  },
  {
    id: 5,
    employee_id: 5,
    employee_number: "EMP-2024-005",
    employee_name: "Robert Cruz",
    department: "Marketing",
    position: "Marketing Manager",
    date: new Date().toISOString().split("T")[0],
    time_in: "08:12",
    time_out: "17:15",
    status: "late",
    late_minutes: 12,
    hours_worked: 8.0,
    remarks: "Vehicle malfunction",
  },
  {
    id: 6,
    employee_id: 6,
    employee_number: "EMP-2024-006",
    employee_name: "Elena Rostova",
    department: "Information Technology",
    position: "UI/UX Designer",
    date: new Date().toISOString().split("T")[0],
    time_in: null,
    time_out: null,
    status: "absent",
    late_minutes: 0,
    hours_worked: 0,
    remarks: "Unexcused absence - Notified HR",
  },
  {
    id: 7,
    employee_id: 7,
    employee_number: "EMP-2024-007",
    employee_name: "David Kim",
    department: "Operations",
    position: "Logistics Coordinator",
    date: new Date().toISOString().split("T")[0],
    time_in: "08:00",
    time_out: "12:00",
    status: "half_day",
    late_minutes: 0,
    hours_worked: 4.0,
    remarks: "Half day - Afternoon personal leave",
  },
];

const STATUS_CONFIG = {
  present:  { label: "Present",  tone: "success", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  late:     { label: "Late",     tone: "warning", bg: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  absent:   { label: "Absent",   tone: "danger",  bg: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
  half_day: { label: "Half Day", tone: "info",    bg: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  on_leave: { label: "On Leave", tone: "purple",  bg: "bg-purple-50 text-purple-700 border-purple-200",    dot: "bg-purple-500" },
  holiday:  { label: "Holiday",  tone: "default", bg: "bg-slate-50 text-slate-700 border-slate-200",       dot: "bg-slate-400" },
};

export default function Attendance() {
  const [logs, setLogs]             = useState(MOCK_ATTENDANCE_LOGS);
  const [loading, setLoading]       = useState(false);
  const [activeTab, setActiveTab]   = useState("live_log"); // 'live_log' | 'employee_summary'
  const [search, setSearch]         = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter]     = useState("all");
  
  // Modals
  const [isLogModalOpen, setIsLogModalOpen]     = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingLog, setEditingLog]             = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_name: "",
    department: "",
    date: new Date().toISOString().split("T")[0],
    time_in: "08:00",
    time_out: "17:00",
    status: "present",
    late_minutes: 0,
    hours_worked: 8,
    remarks: "",
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll({ date: selectedDate });
      if (res.data?.data && res.data.data.length > 0) {
        // Map backend model to flat structure if needed
        const mapped = res.data.data.map(item => ({
          id: item.id,
          employee_id: item.employee_id,
          employee_number: item.employee?.employee_number || `EMP-${item.employee_id}`,
          employee_name: item.employee?.user?.name || item.employee?.full_name || "Employee",
          department: item.employee?.department?.department_name || "General",
          position: item.employee?.position || "Staff",
          date: item.date,
          time_in: item.time_in,
          time_out: item.time_out,
          status: item.status || "present",
          late_minutes: item.late_minutes || 0,
          hours_worked: item.hours_worked || 0,
          remarks: item.remarks || "",
        }));
        setLogs(mapped);
      }
    } catch (err) {
      console.log("Using mock attendance logs as fallback");
    } finally {
      setLoading(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      log.employee_number.toLowerCase().includes(search.toLowerCase()) ||
      log.department.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesDept   = deptFilter === "all" || log.department.toLowerCase() === deptFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Calculate Metrics
  const totalMonitored = logs.length;
  const presentCount   = logs.filter(l => l.status === "present").length;
  const lateCount      = logs.filter(l => l.status === "late").length;
  const absentCount    = logs.filter(l => l.status === "absent").length;
  const leaveCount     = logs.filter(l => l.status === "on_leave").length;
  const halfDayCount   = logs.filter(l => l.status === "half_day").length;
  const presentRate    = totalMonitored > 0 ? Math.round(((presentCount + lateCount + halfDayCount) / totalMonitored) * 100) : 0;

  // Aggregate Employee Summary
  const employeeSummaries = Array.from(
    logs.reduce((acc, log) => {
      if (!acc.has(log.employee_name)) {
        acc.set(log.employee_name, {
          employee_id: log.employee_id,
          employee_number: log.employee_number,
          employee_name: log.employee_name,
          department: log.department,
          position: log.position,
          total_days: 0,
          present_days: 0,
          late_days: 0,
          absent_days: 0,
          leave_days: 0,
          total_hours: 0,
          total_late_mins: 0,
        });
      }
      const item = acc.get(log.employee_name);
      item.total_days += 1;
      if (log.status === "present") item.present_days += 1;
      if (log.status === "late") { item.late_days += 1; item.total_late_mins += (log.late_minutes || 0); }
      if (log.status === "absent") item.absent_days += 1;
      if (log.status === "on_leave") item.leave_days += 1;
      item.total_hours += Number(log.hours_worked || 0);
      return acc;
    }, new Map()).values()
  );

  // Handle Save / Update Log
  const handleOpenCreateModal = () => {
    setEditingLog(null);
    setFormData({
      employee_id: "1",
      employee_name: "John Doe",
      department: "Human Resources",
      date: selectedDate,
      time_in: "08:00",
      time_out: "17:00",
      status: "present",
      late_minutes: 0,
      hours_worked: 8,
      remarks: "",
    });
    setIsLogModalOpen(true);
  };

  const handleOpenEditModal = (log) => {
    setEditingLog(log);
    setFormData({
      employee_id: log.employee_id,
      employee_name: log.employee_name,
      department: log.department,
      date: log.date,
      time_in: log.time_in || "08:00",
      time_out: log.time_out || "17:00",
      status: log.status,
      late_minutes: log.late_minutes || 0,
      hours_worked: log.hours_worked || 8,
      remarks: log.remarks || "",
    });
    setIsLogModalOpen(true);
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (editingLog) {
      // Update
      setLogs(prev => prev.map(item => item.id === editingLog.id ? { ...item, ...formData } : item));
    } else {
      // Create new
      const newLog = {
        id: Date.now(),
        employee_number: `EMP-2024-00${logs.length + 1}`,
        ...formData,
      };
      setLogs(prev => [newLog, ...prev]);
    }
    setIsLogModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Employee Number", "Name", "Department", "Date", "Time In", "Time Out", "Status", "Late (mins)", "Hours Worked", "Remarks"];
    const rows = filteredLogs.map(l => [
      l.employee_number,
      `"${l.employee_name}"`,
      `"${l.department}"`,
      l.date,
      l.time_in || "--:--",
      l.time_out || "--:--",
      l.status,
      l.late_minutes,
      l.hours_worked,
      `"${l.remarks || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Employee Operations & Monitoring
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Attendance Per Employee Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time employee attendance tracking, timesheets, tardiness monitoring, and shift logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 text-xs font-semibold">
            <FiDownload size={15} />
            Export CSV
          </Button>
          <Button variant="primary" onClick={handleOpenCreateModal} className="gap-2 text-xs font-semibold">
            <FiPlus size={15} />
            Log Attendance
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="transition hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Monitored</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiUser size={18} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalMonitored}</p>
            <p className="mt-1 text-xs text-slate-500">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="transition hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Present</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiUserCheck size={18} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-emerald-600">{presentCount}</p>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {presentRate}% rate
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">On-time clock ins</p>
          </CardContent>
        </Card>

        <Card className="transition hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Late / Tardiness</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiClock size={18} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">{lateCount}</p>
            <p className="mt-1 text-xs text-slate-500">Clocked in past schedule</p>
          </CardContent>
        </Card>

        <Card className="transition hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">On Leave / Half Day</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FiCalendar size={18} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-purple-600">{leaveCount + halfDayCount}</p>
            <p className="mt-1 text-xs text-slate-500">{leaveCount} Leave • {halfDayCount} Half Day</p>
          </CardContent>
        </Card>

        <Card className="transition hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Absent</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FiUserX size={18} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-rose-600">{absentCount}</p>
            <p className="mt-1 text-xs text-slate-500">Unexcused / No time in</p>
          </CardContent>
        </Card>
      </div>

      {/* Main View Tabs & Search Filter Container */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab("live_log")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "live_log"
                    ? "bg-white text-[var(--artms-primary)] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FiClock size={14} />
                Daily Attendance Monitoring
              </button>
              <button
                onClick={() => setActiveTab("employee_summary")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "employee_summary"
                    ? "bg-white text-[var(--artms-primary)] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FiFileText size={14} />
                Per Employee Summary & Timesheets
              </button>
            </div>

            {/* Date selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Search & Filter Bar */}
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-6 lg:col-span-5">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search employee name, number, or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>

            <div className="sm:col-span-3 lg:col-span-4">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Departments</option>
                <option value="human resources">Human Resources</option>
                <option value="information technology">Information Technology</option>
                <option value="finance">Finance</option>
                <option value="operations">Operations</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>

          {/* TAB 1: Live Daily Attendance Monitoring Table */}
          {activeTab === "live_log" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <THead>
                  <tr>
                    <TH>Employee</TH>
                    <TH>Department & Role</TH>
                    <TH>Time In</TH>
                    <TH>Time Out</TH>
                    <TH>Hours</TH>
                    <TH>Status</TH>
                    <TH>Remarks</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <TD colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No attendance records found matching filters for {selectedDate}.
                      </TD>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.present;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <TD>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-xs">
                                {log.employee_name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{log.employee_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{log.employee_number}</p>
                              </div>
                            </div>
                          </TD>

                          <TD>
                            <p className="text-xs font-semibold text-slate-800">{log.department}</p>
                            <p className="text-[10px] text-slate-400">{log.position}</p>
                          </TD>

                          <TD>
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {log.time_in ? log.time_in : <span className="text-slate-300">--:--</span>}
                            </span>
                            {log.late_minutes > 0 && (
                              <span className="ml-2 text-[10px] font-bold text-amber-600">
                                (+{log.late_minutes}m)
                              </span>
                            )}
                          </TD>

                          <TD>
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {log.time_out ? log.time_out : <span className="text-slate-300">--:--</span>}
                            </span>
                          </TD>

                          <TD>
                            <span className="font-bold text-xs text-slate-800">{log.hours_worked} hrs</span>
                          </TD>

                          <TD>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${cfg.bg}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </TD>

                          <TD className="max-w-[200px]">
                            <p className="truncate text-xs text-slate-500" title={log.remarks}>
                              {log.remarks || <span className="italic text-slate-300">No remarks</span>}
                            </p>
                          </TD>

                          <TD className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditModal(log)}
                                title="Edit Record"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                              >
                                <FiEdit size={14} />
                              </button>
                            </div>
                          </TD>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* TAB 2: Attendance Per Employee Summary */}
          {activeTab === "employee_summary" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <THead>
                  <tr>
                    <TH>Employee</TH>
                    <TH>Department</TH>
                    <TH className="text-center">Days Monitored</TH>
                    <TH className="text-center">Present</TH>
                    <TH className="text-center">Tardiness (Late)</TH>
                    <TH className="text-center">Absences</TH>
                    <TH className="text-center">Total Hours</TH>
                    <TH className="text-center">Attendance Rate</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {employeeSummaries.map(emp => {
                    const rate = Math.round(((emp.present_days + emp.late_days) / Math.max(emp.total_days, 1)) * 100);
                    return (
                      <tr key={emp.employee_name} className="hover:bg-slate-50 transition">
                        <TD>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                              {emp.employee_name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{emp.employee_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{emp.employee_number}</p>
                            </div>
                          </div>
                        </TD>

                        <TD>
                          <p className="text-xs font-semibold text-slate-800">{emp.department}</p>
                          <p className="text-[10px] text-slate-400">{emp.position}</p>
                        </TD>

                        <TD className="text-center font-bold text-xs text-slate-700">
                          {emp.total_days}
                        </TD>

                        <TD className="text-center">
                          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700">
                            {emp.present_days}
                          </span>
                        </TD>

                        <TD className="text-center">
                          <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                            {emp.late_days} ({emp.total_late_mins}m)
                          </span>
                        </TD>

                        <TD className="text-center">
                          <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-xs font-extrabold text-rose-700">
                            {emp.absent_days}
                          </span>
                        </TD>

                        <TD className="text-center font-extrabold text-xs text-slate-900">
                          {emp.total_hours.toFixed(1)} hrs
                        </TD>

                        <TD className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full ${rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{rate}%</span>
                          </div>
                        </TD>

                        <TD className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsDetailModalOpen(true);
                            }}
                            className="gap-1 text-[11px] py-1"
                          >
                            <FiEye size={13} />
                            View Timesheet
                          </Button>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Create / Edit Attendance Log */}
      <Modal
        open={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={editingLog ? "Edit Attendance Record" : "Record Employee Attendance"}
      >
        <form onSubmit={handleSaveLog} className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Employee Name</label>
              <Input
                type="text"
                value={formData.employee_name}
                onChange={e => setFormData({ ...formData, employee_name: e.target.value })}
                required
                placeholder="e.g. John Doe"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Department</label>
              <Select
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="mt-1"
              >
                <option value="Human Resources">Human Resources</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Time In</label>
              <Input
                type="time"
                value={formData.time_in || ""}
                onChange={e => setFormData({ ...formData, time_in: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Time Out</label>
              <Input
                type="time"
                value={formData.time_out || ""}
                onChange={e => setFormData({ ...formData, time_out: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Attendance Status</label>
              <Select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="mt-1"
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
                <option value="holiday">Holiday</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Late Minutes</label>
              <Input
                type="number"
                min="0"
                value={formData.late_minutes}
                onChange={e => setFormData({ ...formData, late_minutes: Number(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Hours Worked</label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hours_worked}
                onChange={e => setFormData({ ...formData, hours_worked: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Remarks / Reason</label>
            <textarea
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
              placeholder="e.g. Approved official business, traffic delay, medical leave..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingLog ? "Save Changes" : "Log Record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: View Employee Timesheet Detail */}
      {selectedEmployee && (
        <Modal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Timesheet — ${selectedEmployee.employee_name}`}
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs font-bold text-slate-800">{selectedEmployee.employee_name}</p>
                <p className="text-[11px] text-slate-500">{selectedEmployee.department} • {selectedEmployee.position}</p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-600">{selectedEmployee.employee_number}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-50 p-2">
                <p className="font-extrabold text-emerald-700">{selectedEmployee.present_days}</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Present</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <p className="font-extrabold text-amber-700">{selectedEmployee.late_days}</p>
                <p className="text-[10px] text-amber-600 font-semibold">Late Logs</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-2">
                <p className="font-extrabold text-rose-700">{selectedEmployee.absent_days}</p>
                <p className="text-[10px] text-rose-600 font-semibold">Absences</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2">
                <p className="font-extrabold text-blue-700">{selectedEmployee.total_hours.toFixed(1)}h</p>
                <p className="text-[10px] text-blue-600 font-semibold">Total Hours</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Recent Attendance Logs</p>
              <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border border-slate-100 p-2">
                {logs
                  .filter(l => l.employee_name === selectedEmployee.employee_name)
                  .map(log => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{log.date}</span>
                        <span className="ml-2 font-mono text-[11px] text-slate-500">
                          ({log.time_in || "--:--"} - {log.time_out || "--:--"})
                        </span>
                      </div>
                      <Badge tone={STATUS_CONFIG[log.status]?.tone || "default"}>
                        {STATUS_CONFIG[log.status]?.label || log.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
