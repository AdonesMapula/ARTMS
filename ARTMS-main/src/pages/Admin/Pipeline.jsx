/**
 * Pipeline.jsx
 * ────────────
 * Functional Recruitment Pipeline (Kanban Board) for ARTMS HR Admin & Super Admin.
 *
 * Features:
 *  - Real-time data fetching from Laravel API (/api/applicants)
 *  - Filter by Job Posting & Search query
 *  - Drag & Drop applicant cards between stages
 *  - Stage dropdown selector for one-click stage movements
 *  - Interactive Candidate Profile Details Modal
 *  - Integrated "Schedule Interview" action via ScheduleInterviewModal
 *  - Stage Distribution Funnel Analytics Bar
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import { cn } from "../../utils/cn";
import ScheduleInterviewModal from "../../components/interview/ScheduleInterviewModal";
import applicantService from "../../services/applicantService";
import jobService from "../../services/jobService";
import employeeService from "../../services/employeeService";
import { useToast } from "../../context/ToastContext";

// ── Pipeline Stage Definitions ───────────────────────────────────────────────

const STAGES = [
  {
    key: "applied",
    title: "Applied",
    color: "bg-blue-50/80 border-blue-200/80",
    headerBg: "bg-blue-100/80 text-blue-900",
    badgeTone: "info",
    barColor: "bg-blue-500",
  },
  {
    key: "ai_screening",
    title: "AI Screening",
    color: "bg-amber-50/80 border-amber-200/80",
    headerBg: "bg-amber-100/80 text-amber-900",
    badgeTone: "warning",
    barColor: "bg-amber-500",
  },
  {
    key: "screening_passed",
    title: "Screening Passed",
    color: "bg-emerald-50/80 border-emerald-200/80",
    headerBg: "bg-emerald-100/80 text-emerald-900",
    badgeTone: "success",
    barColor: "bg-emerald-500",
  },
  {
    key: "ready_for_interview",
    title: "Ready for Interview",
    color: "bg-violet-50/80 border-violet-200/80",
    headerBg: "bg-violet-100/80 text-violet-900",
    badgeTone: "accent",
    barColor: "bg-violet-500",
  },
  {
    key: "interview_1",
    title: "Interview 1",
    color: "bg-sky-50/80 border-sky-200/80",
    headerBg: "bg-sky-100/80 text-sky-900",
    badgeTone: "info",
    barColor: "bg-sky-600",
  },
  {
    key: "interview_2",
    title: "Interview 2",
    color: "bg-indigo-50/80 border-indigo-200/80",
    headerBg: "bg-indigo-100/80 text-indigo-900",
    badgeTone: "primary",
    barColor: "bg-indigo-600",
  },
  {
    key: "hired",
    title: "Hired",
    color: "bg-teal-50/80 border-teal-200/80",
    headerBg: "bg-teal-100/80 text-teal-900",
    badgeTone: "success",
    barColor: "bg-teal-600",
  },
  {
    key: "rejected",
    title: "Rejected",
    color: "bg-rose-50/80 border-rose-200/80",
    headerBg: "bg-rose-100/80 text-rose-900",
    badgeTone: "danger",
    barColor: "bg-rose-500",
  },
];

// ── Candidate Profile Modal ───────────────────────────────────────────────────

function CandidateDetailModal({ applicant, open, onClose, onSchedule, onStatusChange }) {
  if (!applicant || !open) return null;

  const jobTitle =
    applicant.job_posting?.job_library?.job_title ??
    applicant.jobPosting?.jobLibrary?.job_title ??
    applicant.job_posting?.title ??
    "General Application";

  const aiScore =
    applicant.ai_evaluation?.ai_score ??
    applicant.overall_score ??
    null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Candidate Profile & Pipeline Details"
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2">
            {applicant.status !== "hired" && (
              <Button
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  onStatusChange(applicant.id, "hired");
                  onClose();
                }}
              >
                ✓ Hire Candidate
              </Button>
            )}
            {applicant.status !== "rejected" && (
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  onStatusChange(applicant.id, "rejected");
                  onClose();
                }}
              >
                ✕ Reject
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onClose();
                onSchedule(applicant.id);
              }}
            >
              📅 Schedule Interview
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 py-2">
        {/* Candidate Header */}
        <div className="flex items-start justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-extrabold text-white text-base shadow-md">
              {applicant.first_name?.[0]}{applicant.last_name?.[0]}
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {applicant.first_name} {applicant.last_name}
              </h3>
              <p className="text-xs font-semibold text-blue-600">
                {applicant.application_id} • {jobTitle}
              </p>
            </div>
          </div>
          {aiScore !== null && (
            <div className="text-right bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">AI Score</p>
              <p className="text-lg font-extrabold text-blue-600">{aiScore}/100</p>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-100 p-3 bg-white space-y-1">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Email Address</p>
            <p className="font-semibold text-slate-800">{applicant.email || "N/A"}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 bg-white space-y-1">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Phone Number</p>
            <p className="font-semibold text-slate-800">{applicant.phone || "N/A"}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 bg-white space-y-1">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Current Stage</p>
            <p className="font-bold text-blue-700 capitalize">{applicant.status?.replace(/_/g, " ")}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 bg-white space-y-1">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Shortlisted Status</p>
            <p className="font-semibold text-slate-800">{applicant.is_shortlisted ? "Yes ⭐" : "No"}</p>
          </div>
        </div>

        {/* AI Screening Highlights if available */}
        {applicant.ai_evaluation && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
            <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🧠 AI Screening Summary</span>
            </p>
            <p className="text-xs text-indigo-950 leading-relaxed">
              {applicant.ai_evaluation.summary || "Candidate matches key criteria for this vacancy."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main Pipeline Component ───────────────────────────────────────────────────

export default function Pipeline() {
  const toast = useToast();
  const [applicants, setApplicants]     = useState([]);
  const [jobPostings, setJobPostings]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [updatingId, setUpdatingId]     = useState(null);
  
  // Filter States
  const [search, setSearch]             = useState("");
  const [selectedJob, setSelectedJob]   = useState("");
  
  // Modals & Action States
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [schedModalOpen, setSchedModalOpen]       = useState(false);
  const [prefillAppId, setPrefillAppId]           = useState(null);
  const [draggingAppId, setDraggingAppId]         = useState(null);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, jobRes] = await Promise.all([
        applicantService.getAll({ per_page: 300 }),
        jobService.postings.getAll({ per_page: 100 }).catch(() => ({ data: [] })),
      ]);

      const appList = appRes.data?.data ?? appRes.data ?? [];
      const jobList = jobRes.data?.data ?? jobRes.data ?? [];
      
      setApplicants(appList);
      setJobPostings(jobList);
    } catch (err) {
      console.error("Failed to load pipeline data:", err);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filter Applicants ─────────────────────────────────────────────────────
  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      // Job filter
      if (selectedJob && String(a.job_posting_id) !== String(selectedJob)) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
        const email    = (a.email || "").toLowerCase();
        const appId    = (a.application_id || "").toLowerCase();
        return fullName.includes(q) || email.includes(q) || appId.includes(q);
      }
      return true;
    });
  }, [applicants, selectedJob, search]);

  // Group applicants by stage key with robust status alias mapping
  const stageMap = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => (map[s.key] = []));
    
    filteredApplicants.forEach((a) => {
      let key = "applied";
      const s = (a.status || "").toLowerCase();
      if (s === "applied") key = "applied";
      else if (s === "ai_screening" || s === "under_review") key = "ai_screening";
      else if (s === "screening_passed" || s === "shortlisted") key = "screening_passed";
      else if (s === "ready_for_interview") key = "ready_for_interview";
      else if (s === "interview_1" || s.startsWith("interview_1")) key = "interview_1";
      else if (s === "interview_2" || s.startsWith("interview_2") || s === "final") key = "interview_2";
      else if (s === "hired") key = "hired";
      else if (s === "rejected" || s === "screening_failed") key = "rejected";

      if (map[key]) map[key].push(a);
      else map["applied"].push(a);
    });
    return map;
  }, [filteredApplicants]);

  // ── Move Applicant Stage ─────────────────────────────────────────────────
  const moveApplicantStage = async (applicantId, newStageKey) => {
    setUpdatingId(applicantId);
    
    // Map stage key to exact database status string
    const STAGE_TO_STATUS = {
      applied: "applied",
      ai_screening: "ai_screening",
      screening_passed: "screening_passed",
      ready_for_interview: "ready_for_interview",
      interview_1: "interview_1_scheduled",
      interview_2: "interview_2_scheduled",
      hired: "hired",
      rejected: "rejected",
    };
    const targetStatus = STAGE_TO_STATUS[newStageKey] || newStageKey;

    // Optimistic UI update
    const oldApplicant = applicants.find(a => a.id === applicantId);
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicantId ? { ...a, status: targetStatus } : a))
    );

    try {
      if (targetStatus === "hired") {
        await employeeService.hireApplicant(applicantId);
        const name = oldApplicant ? `${oldApplicant.first_name} ${oldApplicant.last_name}` : "Applicant";
        toast.success("Applicant Hired!", `${name} was hired & a Digital 201 File was generated!`);
      } else {
        await applicantService.update(applicantId, { status: targetStatus });
        const name = oldApplicant ? `${oldApplicant.first_name} ${oldApplicant.last_name}` : "Applicant";
        const stageLabel = targetStatus.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        toast.success("Stage Updated", `${name} moved to "${stageLabel}".`);
      }
    } catch (err) {
      console.error("Failed to update applicant stage:", err);
      toast.error("Update Failed", err?.response?.data?.message || "Failed to move applicant. Changes have been reverted.");
      // Rollback on error
      loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────
  const handleDragStart = (e, applicantId) => {
    setDraggingAppId(applicantId);
    e.dataTransfer.setData("text/plain", String(applicantId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetStageKey) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain") || draggingAppId;
    if (idStr) {
      moveApplicantStage(Number(idStr), targetStageKey);
    }
    setDraggingAppId(null);
  };

  // ── Open Schedule Interview Modal ─────────────────────────────────────────
  const openScheduleModal = (applicantId) => {
    setPrefillAppId(applicantId);
    setSchedModalOpen(true);
  };

  const totalCount = filteredApplicants.length;

  return (
    <div className="space-y-5 pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Recruitment Management
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Interactive Recruitment Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount} total active candidate{totalCount === 1 ? "" : "s"} across all pipeline stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading} className="shrink-0">
            {loading ? "Refreshing…" : "🔄 Refresh"}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="w-full md:flex-1">
              <input
                type="text"
                placeholder="Search candidates by name, email, or APP-ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Position Select */}
            <div className="w-full md:w-64">
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Job Vacancies</option>
                {jobPostings.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_library?.job_title ?? j.title ?? `Job #${j.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Funnel Progress Distribution Bar */}
          {totalCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>Stage Distribution</span>
                <span>{totalCount} Total Candidates</span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                {STAGES.map((s) => {
                  const count = stageMap[s.key]?.length || 0;
                  const pct = totalCount ? (count / totalCount) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={s.key}
                      className={cn("h-full transition-all", s.barColor)}
                      style={{ width: `${pct}%` }}
                      title={`${s.title}: ${count} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-semibold">Loading candidate pipeline…</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3.5">
          {STAGES.map((stage) => {
            const stageItems = stageMap[stage.key] || [];

            return (
              <div
                key={stage.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
                className={cn(
                  "flex flex-col rounded-2xl border p-3 transition-colors min-h-[500px]",
                  stage.color
                )}
              >
                {/* Stage Header */}
                <div className={cn("flex items-center justify-between rounded-xl px-3 py-2 mb-3 shadow-xs font-bold text-xs", stage.headerBg)}>
                  <span>{stage.title}</span>
                  <Badge tone={stage.badgeTone}>{stageItems.length}</Badge>
                </div>

                {/* Candidate Cards Column */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                  {stageItems.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300/60 p-3 text-center">
                      <p className="text-[11px] font-medium text-slate-400">
                        Drop candidates here
                      </p>
                    </div>
                  ) : (
                    stageItems.map((applicant) => {
                      const jobTitle =
                        applicant.job_posting?.job_library?.job_title ??
                        applicant.jobPosting?.jobLibrary?.job_title ??
                        applicant.job_posting?.title ??
                        "General";

                      const score =
                        applicant.ai_evaluation?.ai_score ??
                        applicant.overall_score ??
                        null;

                      const isUpdating = updatingId === applicant.id;

                      return (
                        <div
                          key={applicant.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, applicant.id)}
                          className={cn(
                            "group relative rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                            isUpdating && "opacity-50 pointer-events-none"
                          )}
                        >
                          {/* Candidate Initials + Name */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                                {applicant.first_name?.[0]}{applicant.last_name?.[0]}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                  {applicant.first_name} {applicant.last_name}
                                </h4>
                                <p className="text-[10px] text-slate-400">
                                  {applicant.application_id}
                                </p>
                              </div>
                            </div>

                            {/* AI Score Badge if present */}
                            {score !== null && (
                              <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-100">
                                {score} pt
                              </span>
                            )}
                          </div>

                          {/* Position applied */}
                          <p className="text-[11px] font-medium text-slate-500 truncate mb-2.5">
                            {jobTitle}
                          </p>

                          {/* Controls & Actions */}
                          <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 text-[10px]">
                            
                            {/* Details Button */}
                            <button
                              onClick={() => setSelectedApplicant(applicant)}
                              className="font-bold text-slate-500 hover:text-blue-600 transition"
                            >
                              👁️ Details
                            </button>

                            {/* Schedule Interview (if in stage) */}
                            {(stage.key === "shortlisted" || stage.key === "ready_for_interview" || stage.key === "applied") && (
                              <button
                                onClick={() => openScheduleModal(applicant.id)}
                                className="font-bold text-blue-600 hover:text-blue-800 transition"
                              >
                                📅 Sched
                              </button>
                            )}

                            {/* Quick Stage Move Dropdown */}
                            <select
                              value={applicant.status || "applied"}
                              onChange={(e) => moveApplicantStage(applicant.id, e.target.value)}
                              className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-medium text-slate-600 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Profile Side Modal */}
      <CandidateDetailModal
        applicant={selectedApplicant}
        open={Boolean(selectedApplicant)}
        onClose={() => setSelectedApplicant(null)}
        onSchedule={(id) => openScheduleModal(id)}
        onStatusChange={(id, stage) => moveApplicantStage(id, stage)}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        open={schedModalOpen}
        onClose={() => setSchedModalOpen(false)}
        prefillApplicantId={prefillAppId}
        onSaved={() => {
          loadData();
          setSchedModalOpen(false);
        }}
      />
    </div>
  );
}
