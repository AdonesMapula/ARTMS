/**
 * InterviewCalendar.jsx
 * ──────────────────────
 * High-precision Interview Calendar UI for ARTMS HR Admin & Super Admin.
 * Matches the user reference design with dynamic month grid, daily timeline sidebar,
 * status legends, and SVG icons.
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar, FiClock, FiChevronLeft, FiChevronRight,
  FiX, FiCheckCircle, FiVideo, FiUser, FiDownload, FiPlus, FiAlertCircle
} from "react-icons/fi";

import Button from "../../components/ui/Button";
import CardSkeleton from "../../components/ui/CardSkeleton";
import ScheduleInterviewModal from "../../components/interview/ScheduleInterviewModal";
import interviewService from "../../services/interviewService";
import { useToast } from "../../context/ToastContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDateFull(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InterviewCalendar({ onClose, embedded = false }) {
  const navigate = useNavigate();
  const toast = useToast();

  // Current Date State
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode]         = useState("month"); // "month" | "week" | "day"
  
  // Data State
  const [interviews, setInterviews]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [schedModalOpen, setSchedModalOpen] = useState(false);
  const [activeInterviewForEdit, setActiveInterviewForEdit] = useState(null);

  // ── Load Interviews from Backend API ──────────────────────────────────────
  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getAll({ per_page: 300 });
      const list = res.data?.data ?? res.data ?? [];
      setInterviews(list);
    } catch (err) {
      console.error("Failed to load calendar interviews:", err);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  // ── Month Calculations ─────────────────────────────────────────────────────
  const cYear  = currentDate.getFullYear();
  const cMonth = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const firstDayOfWeek = new Date(cYear, cMonth, 1).getDay(); // 0 = Sun
  const daysInMonth    = new Date(cYear, cMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(cYear, cMonth, 0).getDate();

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(cYear, cMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(cYear, cMonth + 1, 1));
  const goToday   = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Map interviews to dates
  const interviewsByDate = useMemo(() => {
    const map = {};
    interviews.forEach((iv) => {
      if (!iv.scheduled_at) return;
      const d = new Date(iv.scheduled_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(iv);
    });
    return map;
  }, [interviews]);

  // Selected Day Interviews
  const selectedDayKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
  const selectedDayInterviews = useMemo(() => {
    const list = interviewsByDate[selectedDayKey] || [];
    return [...list].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [interviewsByDate, selectedDayKey]);

  const isTodaySelected = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  // Export Agenda Handler
  const handleExportAgenda = () => {
    if (selectedDayInterviews.length === 0) {
      toast.warning("No Interviews", "No interviews are scheduled for this day to export.");
      return;
    }
    let csv = "Time,Applicant,Job Role,Stage,Type,Status\n";
    selectedDayInterviews.forEach((iv) => {
      const applicantName = `${iv.applicant?.first_name || ""} ${iv.applicant?.last_name || ""}`.trim();
      const jobRole = iv.job_posting?.job_library?.job_title ?? iv.job_posting?.title ?? "N/A";
      csv += `"${fmtTime(iv.scheduled_at)}","${applicantName}","${jobRole}","${iv.interview_stage}","${iv.interview_type}","${iv.status}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Agenda_${selectedDayKey}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-white font-sans text-slate-800">
      
      {/* ── Top Header Bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiCalendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1e293b] tracking-tight">
              Interview Calendar
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Schedule, track & manage recruitment sessions
            </p>
          </div>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            {["month", "week", "day"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${
                  viewMode === mode
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setSchedModalOpen(true)}
            className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold text-xs py-2 px-4 rounded-xl"
          >
            <FiPlus className="h-4 w-4" /> Schedule Interview
          </Button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Close Calendar"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Split View ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* ── Left 8 Columns: Calendar Month Grid ────────────────────────── */}
        <div className="lg:col-span-8 p-6 overflow-y-auto flex flex-col justify-between border-r border-slate-200">
          
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            
            {/* Month Navigator */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-[#1e293b] min-w-[160px]">
                {monthName}
              </h2>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
                <button
                  onClick={prevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToday}
                  className="px-3 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Upcoming
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Cancelled
              </span>
            </div>
          </div>

          {/* Month Calendar Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <div key={d} className="py-3 text-[11px] font-extrabold text-slate-400 tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-white">
              
              {/* Previous Month Padding Days */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
                const dayNum = daysInPrevMonth - firstDayOfWeek + idx + 1;
                return (
                  <div key={`prev-${idx}`} className="min-h-[100px] p-2 bg-slate-50/40 text-slate-300 font-semibold text-xs">
                    {dayNum}
                  </div>
                );
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = new Date(cYear, cMonth, dayNum);
                const cellKey = `${cYear}-${cMonth}-${dayNum}`;
                const dayEvts = interviewsByDate[cellKey] || [];

                const today = new Date();
                const isCellToday =
                  dayNum === today.getDate() &&
                  cMonth === today.getMonth() &&
                  cYear === today.getFullYear();

                const isCellSelected =
                  dayNum === selectedDate.getDate() &&
                  cMonth === selectedDate.getMonth() &&
                  cYear === selectedDate.getFullYear();

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`min-h-[105px] p-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isCellToday
                        ? "border-2 border-orange-500 bg-amber-50/20"
                        : isCellSelected
                        ? "bg-blue-50/30"
                        : "hover:bg-slate-50/80 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isCellToday
                            ? "text-orange-600 font-black text-sm"
                            : isCellSelected
                            ? "text-blue-600 font-extrabold"
                            : "text-slate-700"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isCellToday && (
                        <span className="rounded bg-orange-500 px-1 py-0.5 text-[9px] font-black text-white tracking-wider">
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Interview Chips */}
                    <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                      {dayEvts.slice(0, 2).map((iv) => {
                        const name = iv.applicant?.last_name
                          ? `${iv.applicant.first_name?.[0] || ""}. ${iv.applicant.last_name}`
                          : iv.applicant?.first_name || "Candidate";

                        let chipBg = "bg-blue-100 text-blue-800 border-l-2 border-blue-500";
                        if (iv.status === "completed" || iv.status === "done") {
                          chipBg = "bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500";
                        } else if (iv.status === "cancelled" || iv.status === "no_show") {
                          chipBg = "bg-rose-100 text-rose-800 border-l-2 border-rose-500";
                        } else if (isCellToday) {
                          chipBg = "bg-amber-100 text-amber-900 border-l-2 border-amber-500";
                        }

                        return (
                          <div
                            key={iv.id}
                            className={`truncate rounded px-1.5 py-0.5 text-[10px] font-bold shadow-2xs ${chipBg}`}
                            title={`${fmtTime(iv.scheduled_at)} - ${iv.applicant?.first_name} ${iv.applicant?.last_name}`}
                          >
                            {fmtTime(iv.scheduled_at)} - {name}
                          </div>
                        );
                      })}
                      {dayEvts.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1">
                          +{dayEvts.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Next Month Padding Days */}
              {Array.from({ length: (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7 }).map((_, idx) => (
                <div key={`next-${idx}`} className="min-h-[100px] p-2 bg-slate-50/40 text-slate-300 font-semibold text-xs">
                  {idx + 1}
                </div>
              ))}

            </div>
          </div>
        </div>

        {/* ── Right 4 Columns: Daily Schedule Timeline Sidebar (Matching Design) ── */}
        <div className="lg:col-span-4 bg-[#f8fafc] p-6 flex flex-col justify-between border-l border-slate-200">
          <div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-extrabold text-[#1e293b]">
                Daily Schedule
              </h3>
              <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                {selectedDayInterviews.length} INTERVIEWS
              </span>
            </div>

            <p className="text-xs font-extrabold text-slate-900">
              {fmtDateFull(selectedDate)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mb-6">
              Timeline view of your day's agenda
            </p>

            {/* Timeline List */}
            {loading ? (
              <div className="py-4">
                <CardSkeleton count={3} className="!grid-cols-1" />
              </div>
            ) : selectedDayInterviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
                <FiCalendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">No interviews scheduled</p>
                <p className="text-[11px] text-slate-400 mt-1">Select another day or click Schedule Interview.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-2">
                {selectedDayInterviews.map((iv) => {
                  const applicantName = `${iv.applicant?.first_name || ""} ${iv.applicant?.last_name || ""}`.trim() || "Candidate";
                  const jobRole = iv.job_posting?.job_library?.job_title ?? iv.job_posting?.title ?? "Applicant";
                  
                  const isDone = iv.status === "completed" || iv.status === "done";
                  const isLive = iv.status === "active";
                  const isOnline = iv.interview_type === "online";

                  let borderColor = "border-l-4 border-slate-800";
                  let dotColor = "bg-slate-800";
                  let statusBadge = (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                      VIRTUAL
                    </span>
                  );

                  if (isLive) {
                    borderColor = "border-l-4 border-orange-500";
                    dotColor = "bg-orange-500 animate-ping";
                    statusBadge = (
                      <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 uppercase tracking-wider">
                        LIVE NOW
                      </span>
                    );
                  } else if (isDone) {
                    borderColor = "border-l-4 border-emerald-500";
                    dotColor = "bg-emerald-500";
                    statusBadge = (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                        <FiCheckCircle className="h-3 w-3" /> COMPLETED
                      </span>
                    );
                  }

                  return (
                    <div key={iv.id} className="relative group">
                      
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-white shadow-xs ${dotColor}`}
                      />

                      <p className="text-[11px] font-extrabold text-slate-500 mb-1">
                        {fmtTime(iv.scheduled_at)}
                      </p>

                      {/* Card Item */}
                      <div
                        className={`rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80 transition-all hover:shadow-md ${borderColor}`}
                      >
                        <h4
                          onClick={() => {
                            setActiveInterviewForEdit(iv);
                            setSchedModalOpen(true);
                          }}
                          className="text-sm font-extrabold text-slate-900 leading-tight hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {applicantName}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 mb-3">
                          {jobRole}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          {statusBadge}

                          {isOnline && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/interview/${iv.id}/room`);
                              }}
                              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                            >
                              <FiVideo className="h-3.5 w-3.5" /> Join
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Bottom Export Button (Matching Design) */}
          <div className="pt-6">
            <button
              onClick={handleExportAgenda}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a237e] hover:bg-[#121961] py-4 text-sm font-extrabold text-white shadow-md transition-all active:scale-[0.99]"
            >
              <FiDownload className="h-4 w-4" /> Export Day Agenda
            </button>
          </div>

        </div>

      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        open={schedModalOpen}
        prefillInterview={activeInterviewForEdit}
        onClose={() => {
          setSchedModalOpen(false);
          setActiveInterviewForEdit(null);
        }}
        onSaved={() => {
          loadInterviews();
          setSchedModalOpen(false);
          setActiveInterviewForEdit(null);
        }}
      />
    </div>
  );
}
