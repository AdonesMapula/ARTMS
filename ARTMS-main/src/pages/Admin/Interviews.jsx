/**
 * Interviews.jsx  — full Interview Module page
 *
 * Features:
 *  ✅ Real API data (interviewService)
 *  ✅ Schedule interview + auto email invitation modal
 *  ✅ Status dropdown with colored indicators (inline update)
 *  ✅ Star rating display per row + full evaluation modal per stage
 *  ✅ Multi-stage tabs: All / Interview 1 / Interview 2 / Final
 *  ✅ Send reminder button
 *  ✅ Search + status filter
 *  ✅ Pagination
 *  ✅ Calendar view (highlights days with interviews)
 */
import { useState, useEffect, useCallback } from "react";
import {
  FiCalendar, FiClock, FiMapPin, FiLink,
  FiPlus, FiBell, FiClipboard, FiRefreshCw,
} from "react-icons/fi";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";

import StarRating from "../../components/interview/StarRating";
import StatusDropdown, { StatusBadge } from "../../components/interview/StatusDropdown";
import ScheduleInterviewModal from "../../components/interview/ScheduleInterviewModal";
import EvaluationModal from "../../components/interview/EvaluationModal";

import interviewService from "../../services/interviewService";
import applicantService from "../../services/applicantService";

// ── constants ──────────────────────────────────────────────────────────────
const STAGE_TABS = [
  { key: "",           label: "All"         },
  { key: "interview_1",label: "Interview 1" },
  { key: "interview_2",label: "Interview 2" },
  { key: "final",      label: "Final"       },
];

const STAGE_TONE = {
  interview_1: "info",
  interview_2: "warning",
  final:       "accent",
};

const STAGE_LABEL = {
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  final:       "Final",
};

const TYPE_ICON = {
  in_person: <FiMapPin size={11} />,
  online:    <FiLink   size={11} />,
  phone:     <FiCalendar size={11} />,
};

const TYPE_LABEL = {
  in_person: "In-Person",
  online:    "Online",
  phone:     "Phone",
};

// ── helpers ────────────────────────────────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDayOfMonth(dt) {
  return dt ? new Date(dt).getDate() : null;
}
function fmtMonth(dt) {
  return dt ? new Date(dt).getMonth() : null;
}
function fmtYear(dt) {
  return dt ? new Date(dt).getFullYear() : null;
}

// ── component ──────────────────────────────────────────────────────────────
export default function Interviews() {
  // ── view state ────────────────────────────────────────────────────────
  const [view,        setView]       = useState("list");    // "list" | "calendar"
  const [stageTab,    setStageTab]   = useState("");
  const [search,      setSearch]     = useState("");
  const [statusFilter,setStatusFilter] = useState("");
  const [page,        setPage]       = useState(1);

  // ── data state ────────────────────────────────────────────────────────
  const [interviews,  setInterviews] = useState([]);
  const [meta,        setMeta]       = useState(null);   // pagination meta
  const [applicants,  setApplicants] = useState([]);
  const [loading,     setLoading]    = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // { [id]: true }

  // ── modal state ───────────────────────────────────────────────────────
  const [scheduleOpen,  setScheduleOpen]  = useState(false);
  const [evalOpen,      setEvalOpen]      = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);

  // ── fetch interviews ──────────────────────────────────────────────────
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (stageTab)      params.stage  = stageTab;
      if (statusFilter)  params.status = statusFilter;
      const { data } = await interviewService.getAll(params);
      // Laravel pagination: data.data = rows, data.meta or data.last_page
      const rows = data.data ?? data;
      setInterviews(rows);
      setMeta(data.meta ?? { current_page: data.current_page, last_page: data.last_page, total: data.total });
    } catch {
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, stageTab, statusFilter]);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  // ── fetch applicants once (for schedule modal) ─────────────────────────
  useEffect(() => {
    applicantService
      .getAll({ per_page: 200, status: "shortlisted" })
      .then(({ data }) => setApplicants(data.data ?? data))
      .catch(() => {});
  }, []);

  // ── filtered rows (client-side search) ────────────────────────────────
  const filtered = interviews.filter((i) => {
    if (!search) return true;
    const name = `${i.applicant?.first_name ?? ""} ${i.applicant?.last_name ?? ""}`.toLowerCase();
    const role = i.jobPosting?.jobLibrary?.title?.toLowerCase() ?? "";
    const q    = search.toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  // ── stats ──────────────────────────────────────────────────────────────
  const stats = [
    { label: "Scheduled",  count: interviews.filter(i => i.status === "scheduled").length,  tone: "bg-blue-50 text-blue-700"    },
    { label: "Confirmed",  count: interviews.filter(i => i.status === "confirmed").length,  tone: "bg-emerald-50 text-emerald-700" },
    { label: "Done",       count: interviews.filter(i => i.status === "done").length,       tone: "bg-slate-100 text-slate-600" },
    { label: "Total",      count: meta?.total ?? interviews.length,                          tone: "bg-amber-50 text-amber-700"  },
  ];

  // ── inline status update ───────────────────────────────────────────────
  async function handleStatusChange(interview, newStatus) {
    setActionLoading((s) => ({ ...s, [interview.id]: true }));
    try {
      const { data } = await interviewService.update(interview.id, { status: newStatus });
      setInterviews((prev) =>
        prev.map((i) => (i.id === interview.id ? { ...i, ...data.interview } : i))
      );
    } catch {/* silent */} finally {
      setActionLoading((s) => ({ ...s, [interview.id]: false }));
    }
  }

  // ── send reminder ──────────────────────────────────────────────────────
  async function handleSendReminder(interview) {
    setActionLoading((s) => ({ ...s, [`r_${interview.id}`]: true }));
    try {
      await interviewService.sendReminder(interview.id);
      setInterviews((prev) =>
        prev.map((i) => (i.id === interview.id ? { ...i, reminder_sent: true } : i))
      );
    } catch {/* silent */} finally {
      setActionLoading((s) => ({ ...s, [`r_${interview.id}`]: false }));
    }
  }

  // ── open evaluation modal ──────────────────────────────────────────────
  function openEval(interview) {
    setActiveInterview(interview);
    setEvalOpen(true);
  }

  // ── after new interview scheduled ─────────────────────────────────────
  function handleScheduled(newInterview) {
    setScheduleOpen(false);
    fetchInterviews();
  }

  // ── after evaluation saved ────────────────────────────────────────────
  function handleEvalSaved(updated) {
    setInterviews((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
    );
  }

  // ── calendar: get days that have interviews this month ─────────────────
  const now   = new Date();
  const cYear = now.getFullYear();
  const cMonth= now.getMonth();
  const interviewDays = new Set(
    interviews
      .filter(i => fmtYear(i.scheduled_at) === cYear && fmtMonth(i.scheduled_at) === cMonth)
      .map(i => fmtDayOfMonth(i.scheduled_at))
  );
  const firstDayOfMonth = new Date(cYear, cMonth, 1).getDay();
  const daysInMonth     = new Date(cYear, cMonth + 1, 0).getDate();

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Recruitment
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Interview Scheduling
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Schedule interviews, send email invitations, and record evaluations.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["list", "calendar"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold capitalize transition ${
                view === v
                  ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {v === "list" ? "📋 List" : "📅 Calendar"}
            </button>
          ))}
          <Button onClick={() => setScheduleOpen(true)}>
            <FiPlus size={14} /> Schedule Interview
          </Button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
              <span className={`rounded-xl px-3 py-1 text-lg font-extrabold ${s.tone}`}>
                {s.count}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Stage Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 flex-wrap border-b border-slate-200 pb-px">
        {STAGE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setStageTab(t.key); setPage(1); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 -mb-px ${
              stageTab === t.key
                ? "border-[var(--artms-primary)] text-[var(--artms-primary)] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <Card>
          {/* ── Filters ─────────────────────────────────────────────── */}
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>
                {stageTab ? STAGE_LABEL[stageTab] : "All Interviews"}
                {meta?.total != null && (
                  <span className="ml-2 text-xs font-semibold text-slate-400">
                    ({meta.total})
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="search"
                  placeholder="Search applicant or role…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--artms-ring)] w-52"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--artms-ring)]"
                >
                  <option value="">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
                <button
                  onClick={fetchInterviews}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition"
                  title="Refresh"
                >
                  <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </CardHeader>

          {/* ── Table ───────────────────────────────────────────────── */}
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                <FiRefreshCw className="mr-2 animate-spin" /> Loading interviews…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                <FiCalendar size={32} className="opacity-30" />
                <p className="text-sm font-semibold">No interviews found.</p>
                <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)}>
                  <FiPlus size={12} /> Schedule one
                </Button>
              </div>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Applicant</TH>
                    <TH>Role</TH>
                    <TH>Stage</TH>
                    <TH>Date & Time</TH>
                    <TH>Type</TH>
                    <TH>Status</TH>
                    <TH>Rating</TH>
                    <TH>Decision</TH>
                    <TH>Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {filtered.map((i) => {
                    const busy = actionLoading[i.id];
                    return (
                      <tr key={i.id} className="hover:bg-slate-50">

                        {/* Applicant */}
                        <TD>
                          <div className="font-semibold text-slate-900">
                            {i.applicant?.first_name} {i.applicant?.last_name}
                          </div>
                          <div className="text-xs text-slate-400">{i.applicant?.email}</div>
                        </TD>

                        {/* Role */}
                        <TD className="max-w-[140px]">
                          <span className="block truncate text-xs text-slate-500">
                            {i.jobPosting?.jobLibrary?.title ?? "—"}
                          </span>
                        </TD>

                        {/* Stage */}
                        <TD>
                          <Badge tone={STAGE_TONE[i.interview_stage] ?? "default"}>
                            {STAGE_LABEL[i.interview_stage] ?? i.interview_stage}
                          </Badge>
                        </TD>

                        {/* Date & Time */}
                        <TD>
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                              <FiCalendar size={11} />
                              {fmtDate(i.scheduled_at)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <FiClock size={11} />
                              {fmtTime(i.scheduled_at)}
                            </span>
                          </div>
                        </TD>

                        {/* Type */}
                        <TD>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            {TYPE_ICON[i.interview_type]}
                            {TYPE_LABEL[i.interview_type] ?? i.interview_type}
                          </span>
                          {i.meeting_link && (
                            <a
                              href={i.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-blue-500 hover:underline truncate max-w-[100px]"
                            >
                              Join link
                            </a>
                          )}
                        </TD>

                        {/* Status — inline dropdown */}
                        <TD>
                          <StatusDropdown
                            value={i.status}
                            disabled={busy}
                            onChange={(val) => handleStatusChange(i, val)}
                          />
                          {i.invitation_sent && (
                            <span className="mt-1 block text-[10px] text-slate-400">
                              ✉️ Invite sent
                            </span>
                          )}
                        </TD>

                        {/* Rating */}
                        <TD>
                          {i.rating_score != null ? (
                            <div className="flex flex-col gap-0.5">
                              <StarRating
                                value={Math.round((Number(i.rating_score) / 100) * 5)}
                                size="sm"
                              />
                              <span className="text-[10px] text-slate-400">
                                {i.rating_score}/100
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TD>

                        {/* HR Decision */}
                        <TD>
                          {i.hr_decision === "pass" && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              ✅ Pass
                            </span>
                          )}
                          {i.hr_decision === "fail" && (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                              ❌ Fail
                            </span>
                          )}
                          {(i.hr_decision === "pending" || !i.hr_decision) && (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TD>

                        {/* Actions */}
                        <TD>
                          <div className="flex items-center gap-1">
                            {/* Evaluate button */}
                            <button
                              title="Evaluate"
                              onClick={() => openEval(i)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
                            >
                              <FiClipboard size={13} />
                            </button>

                            {/* Send reminder */}
                            {i.status !== "done" && i.status !== "cancelled" && (
                              <button
                                title={i.reminder_sent ? "Reminder already sent" : "Send Reminder"}
                                disabled={actionLoading[`r_${i.id}`] || i.reminder_sent}
                                onClick={() => handleSendReminder(i)}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                  i.reminder_sent
                                    ? "border-slate-100 text-slate-300 cursor-default"
                                    : "border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                                }`}
                              >
                                <FiBell size={13} className={actionLoading[`r_${i.id}`] ? "animate-bounce" : ""} />
                              </button>
                            )}
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}

            {/* ── Pagination ────────────────────────────────────────── */}
            {meta && meta.total > 10 && (
              <div className="mt-4">
                <Pagination
                  page={page}
                  pageSize={10}
                  total={meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ── Calendar View ────────────────────────────────────────── */
        <Card>
          <CardHeader>
            <CardTitle>
              {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="text-xs font-bold text-slate-400 py-2">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const hasEvent = interviewDays.has(day);
                const isToday  = day === now.getDate();
                // Interviews on this day
                const dayInterviews = interviews.filter(
                  (iv) => fmtDayOfMonth(iv.scheduled_at) === day &&
                           fmtMonth(iv.scheduled_at) === cMonth &&
                           fmtYear(iv.scheduled_at) === cYear
                );
                return (
                  <div
                    key={day}
                    title={dayInterviews.map(iv =>
                      `${iv.applicant?.first_name} ${iv.applicant?.last_name} — ${fmtTime(iv.scheduled_at)}`
                    ).join("\n")}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition cursor-default ${
                      isToday
                        ? "ring-2 ring-[var(--artms-primary)] bg-[var(--artms-primary)] text-white"
                        : hasEvent
                        ? "bg-blue-100 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvent && !isToday && (
                      <span className="mt-0.5 flex gap-0.5">
                        {dayInterviews.slice(0, 3).map((_, idx) => (
                          <span key={idx} className="h-1 w-1 rounded-full bg-blue-500" />
                        ))}
                      </span>
                    )}
                    {hasEvent && isToday && (
                      <span className="mt-0.5 text-[10px] font-bold opacity-80">
                        {dayInterviews.length}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[var(--artms-primary)]" /> Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-blue-200" /> Has interviews
              </span>
            </div>

            {/* Upcoming list for this month */}
            {interviews.filter(
              iv => fmtMonth(iv.scheduled_at) === cMonth && fmtYear(iv.scheduled_at) === cYear
            ).length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                  This Month
                </p>
                {interviews
                  .filter(iv => fmtMonth(iv.scheduled_at) === cMonth && fmtYear(iv.scheduled_at) === cYear)
                  .sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                  .map((iv) => (
                    <div
                      key={iv.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 hover:bg-slate-50 transition"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {iv.applicant?.first_name} {iv.applicant?.last_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {STAGE_LABEL[iv.interview_stage]} — {fmtDate(iv.scheduled_at)} {fmtTime(iv.scheduled_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={iv.status} />
                        <button
                          onClick={() => openEval(iv)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition"
                          title="Evaluate"
                        >
                          <FiClipboard size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <ScheduleInterviewModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSaved={handleScheduled}
        applicants={applicants}
      />

      <EvaluationModal
        open={evalOpen}
        onClose={() => { setEvalOpen(false); setActiveInterview(null); }}
        onSaved={handleEvalSaved}
        interview={activeInterview}
      />
    </div>
  );
}
