/**
 * Pipeline.jsx
 * ────────────
 * Functional Recruitment Pipeline (Kanban Board & List View) for ARTMS HR Admin & Super Admin.
 *
 * Features:
 *  - Dual View Mode: Interactive Kanban Board & Rich Data List View
 *  - Real-time data fetching from Laravel API (/api/applicants)
 *  - Advanced Filter Suite: Job Vacancy, Pipeline Stage, AI Fit Score, Search Query & Multi-sort
 *  - Drag & Drop applicant cards between stages (Kanban)
 *  - One-click Stage dropdown selector for instantaneous stage movements
 *  - Interactive Candidate Profile Details Modal
 *  - Integrated "Schedule Interview" action via ScheduleInterviewModal
 *  - Stage Distribution Funnel Analytics Bar
 *  - Responsive Pagination & Empty State handling
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Briefcase,
  ChevronDown,
  RefreshCw,
  Calendar,
  Eye,
  Users,
  CheckCircle,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  UserCheck,
  Clock,
  Filter,
  X,
  Phone,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import CardSkeleton from "../../components/ui/CardSkeleton";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";
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

// Map arbitrary status string to exact normalized stage key
function normalizeStageKey(status) {
  const s = (status || "").toLowerCase();
  if (s === "applied") return "applied";
  if (s === "ai_screening" || s === "under_review") return "ai_screening";
  if (s === "screening_passed" || s === "shortlisted") return "screening_passed";
  if (s === "ready_for_interview") return "ready_for_interview";
  if (s === "interview_1" || s.startsWith("interview_1")) return "interview_1";
  if (s === "interview_2" || s.startsWith("interview_2") || s === "final") return "interview_2";
  if (s === "hired") return "hired";
  if (s === "rejected" || s === "screening_failed") return "rejected";
  return "applied";
}

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
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
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
                className="border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
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
              className="cursor-pointer"
              onClick={() => {
                onClose();
                onSchedule(applicant.id);
              }}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Calendar size={15} /> Schedule Interview
              </span>
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={onClose}>Close</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Candidate Header */}
        <div className="flex items-start justify-between rounded-md bg-slate-50/80 dark:bg-slate-900/60 p-3.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm border border-slate-200 dark:border-slate-700">
              {applicant.first_name?.[0]}{applicant.last_name?.[0]}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {applicant.first_name} {applicant.last_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{applicant.application_id}</span> • {jobTitle}
              </p>
            </div>
          </div>
          {aiScore !== null && (
            <div className="text-right bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI Score</p>
              <p className="text-base font-mono font-bold text-slate-900 dark:text-white">{Math.round(Number(aiScore))}%</p>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-md border border-slate-200/80 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900 space-y-0.5">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Email Address</p>
            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{applicant.email || "—"}</p>
          </div>
          <div className="rounded-md border border-slate-200/80 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900 space-y-0.5">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Phone Number</p>
            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{applicant.phone || "—"}</p>
          </div>
          <div className="rounded-md border border-slate-200/80 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900 space-y-0.5">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Current Stage</p>
            <p className="font-bold text-slate-900 dark:text-white capitalize">{applicant.status?.replace(/_/g, " ")}</p>
          </div>
          <div className="rounded-md border border-slate-200/80 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900 space-y-0.5">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Shortlisted Status</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{applicant.is_shortlisted ? "Yes ⭐" : "No"}</p>
          </div>
        </div>

        {/* AI Screening Highlights if available */}
        {applicant.ai_evaluation && (
          <div className="rounded-md border border-indigo-200/60 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>AI Screening Summary</span>
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {applicant.ai_evaluation.summary || applicant.ai_evaluation.ai_summary || "Candidate matches key criteria for this vacancy."}
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

  // View Mode: 'kanban' | 'list'
  const [viewMode, setViewMode]         = useState("kanban");
  
  // Filter States
  const [search, setSearch]             = useState("");
  const [selectedJob, setSelectedJob]   = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [scoreFilter, setScoreFilter]   = useState("");
  const [sortBy, setSortBy]             = useState("newest");
  
  // Pagination State for List View
  const [currentPage, setCurrentPage]   = useState(1);
  const pageSize = 12;
  
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
        applicantService.getAll({ per_page: 500 }),
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

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedJob, selectedStage, scoreFilter, sortBy]);

  // ── Filter & Sort Applicants ──────────────────────────────────────────────
  const filteredApplicants = useMemo(() => {
    let result = applicants.filter((a) => {
      // 1. Job Vacancy filter
      if (selectedJob && String(a.job_posting_id) !== String(selectedJob)) {
        return false;
      }

      // 2. Stage filter
      if (selectedStage) {
        const stageKey = normalizeStageKey(a.status);
        if (stageKey !== selectedStage) {
          return false;
        }
      }

      // 3. AI Score filter
      const score = Number(a.ai_evaluation?.ai_score ?? a.overall_score ?? -1);
      if (scoreFilter === "high" && score < 80) return false;
      if (scoreFilter === "medium" && (score < 60 || score >= 80)) return false;
      if (scoreFilter === "low" && (score < 0 || score >= 60)) return false;
      if (scoreFilter === "unscored" && score >= 0) return false;

      // 4. Text Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const fullName = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        const email    = (a.email || "").toLowerCase();
        const phone    = (a.phone || "").toLowerCase();
        const appId    = (a.application_id || "").toLowerCase();
        const jobTitle = (
          a.job_posting?.job_library?.job_title ||
          a.jobPosting?.jobLibrary?.job_title ||
          a.job_posting?.title ||
          ""
        ).toLowerCase();

        return (
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          appId.includes(q) ||
          jobTitle.includes(q)
        );
      }

      return true;
    });

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === "score_desc") {
        const sA = Number(a.ai_evaluation?.ai_score ?? a.overall_score ?? 0);
        const sB = Number(b.ai_evaluation?.ai_score ?? b.overall_score ?? 0);
        return sB - sA;
      }
      if (sortBy === "score_asc") {
        const sA = Number(a.ai_evaluation?.ai_score ?? a.overall_score ?? 0);
        const sB = Number(b.ai_evaluation?.ai_score ?? b.overall_score ?? 0);
        return sA - sB;
      }
      if (sortBy === "name_asc") {
        const nA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nA.localeCompare(nB);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      // default: newest
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return result;
  }, [applicants, selectedJob, selectedStage, scoreFilter, search, sortBy]);

  // Group applicants by stage key for Kanban view
  const stageMap = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => (map[s.key] = []));
    
    filteredApplicants.forEach((a) => {
      const key = normalizeStageKey(a.status);
      if (map[key]) map[key].push(a);
      else map["applied"].push(a);
    });
    return map;
  }, [filteredApplicants]);

  // Paginated data for List View
  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplicants.slice(start, start + pageSize);
  }, [filteredApplicants, currentPage, pageSize]);

  // Active filters count
  const activeFiltersCount = [
    Boolean(search.trim()),
    Boolean(selectedJob),
    Boolean(selectedStage),
    Boolean(scoreFilter),
    sortBy !== "newest",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setSelectedJob("");
    setSelectedStage("");
    setScoreFilter("");
    setSortBy("newest");
  };

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

  const stats = {
    applied: stageMap["applied"]?.length || 0,
    passed: stageMap["screening_passed"]?.length || 0,
    interviews: (stageMap["interview_1"]?.length || 0) + (stageMap["interview_2"]?.length || 0) + (stageMap["ready_for_interview"]?.length || 0),
    hired: stageMap["hired"]?.length || 0,
  };

  return (
    <div className="space-y-4 pb-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-xs bg-slate-900 dark:bg-white" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recruitment Pipeline
            </p>
          </div>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Candidate Pipeline & Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalCount} active candidate{totalCount === 1 ? "" : "s"} across all pipeline stages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200/90 dark:border-slate-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer",
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Kanban Board View"
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="List View"
            >
              <List size={13} />
              <span>List View</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="shrink-0 flex items-center gap-1.5 font-medium cursor-pointer rounded-md">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Stats Summary ───────────────────────────────────────────────────── */}
      <div className="grid gap-2.5 sm:grid-cols-4">
        <SummaryCard label="Applied" value={stats.applied} color="blue" icon={Users} />
        <SummaryCard label="Screening Passed" value={stats.passed} color="emerald" icon={CheckCircle} />
        <SummaryCard label="In Interviews" value={stats.interviews} color="amber" icon={Calendar} />
        <SummaryCard label="Hired" value={stats.hired} color="teal" icon={Briefcase} />
      </div>

      {/* Comprehensive Filter Toolbar */}
      <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3.5 shadow-2xs space-y-3">
        {/* Row 1: Search & Vacancy Selection */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Search Input */}
          <div className="md:col-span-6">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search candidates by name, email, phone, or APP-ID…"
              className="h-9 text-xs rounded-md"
            />
          </div>

          {/* Position Select */}
          <div className="md:col-span-6">
            <Select
              icon={Briefcase}
              size="sm"
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              buttonClassName="bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 h-9 text-xs rounded-md"
            >
              <option value="">All Job Vacancies</option>
              {jobPostings.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_library?.job_title ?? j.title ?? `Job #${j.id}`}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Row 2: Granular Filters (Stage, AI Score, Sorting) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {/* Stage Selector Filter */}
          <div>
            <Select
              icon={Filter}
              size="sm"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              buttonClassName="bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 h-9 text-xs rounded-md"
            >
              <option value="">All Pipeline Stages</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.title} ({stageMap[s.key]?.length || 0})
                </option>
              ))}
            </Select>
          </div>

          {/* Score Match Filter */}
          <div>
            <Select
              icon={Sparkles}
              size="sm"
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              buttonClassName="bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 h-9 text-xs rounded-md"
            >
              <option value="">All AI Fit Scores</option>
              <option value="high">High Fit (80% – 100%)</option>
              <option value="medium">Medium Fit (60% – 79%)</option>
              <option value="low">Low Fit (&lt; 60%)</option>
              <option value="unscored">Unscored / Pending</option>
            </Select>
          </div>

          {/* Sort Order */}
          <div>
            <Select
              icon={ArrowUpDown}
              size="sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              buttonClassName="bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 h-9 text-xs rounded-md"
            >
              <option value="newest">Latest Applications First</option>
              <option value="oldest">Oldest Applications First</option>
              <option value="score_desc">Highest AI Score First</option>
              <option value="score_asc">Lowest AI Score First</option>
              <option value="name_asc">Candidate Name (A – Z)</option>
            </Select>
          </div>

          {/* Active Filters / Reset button */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center rounded-md"
              >
                <X size={13} />
                <span>Reset Filters ({activeFiltersCount})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Funnel Progress Distribution Bar */}
        {totalCount > 0 && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Stage Distribution</span>
              <span className="font-mono">{totalCount} Candidates</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
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
      </div>

      {/* ── Main View Content ────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-6">
          <CardSkeleton count={viewMode === "kanban" ? 8 : 4} className={viewMode === "kanban" ? "!grid-cols-2 md:!grid-cols-4 lg:!grid-cols-8" : ""} />
        </div>
      ) : filteredApplicants.length === 0 ? (
        /* Empty State */
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto mb-3">
              <Users size={28} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">No Applicants Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {activeFiltersCount > 0
                ? "No candidates matched your search and filter criteria. Try adjusting or resetting your filters."
                : "There are currently no active applications in the recruitment pipeline."}
            </p>
            {activeFiltersCount > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="font-bold cursor-pointer">
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        /* ── Kanban Board View ─────────────────────────────────────────── */
        <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-thin">
          <div className="grid grid-cols-8 gap-2.5 min-w-[1360px] w-full">
            {STAGES.map((stage) => {
              const stageItems = stageMap[stage.key] || [];

              return (
                <div
                  key={stage.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.key)}
                  className={cn(
                    "flex flex-col rounded-lg border p-2 transition-colors min-h-[500px] max-h-[calc(100vh-250px)] bg-slate-50/70 dark:bg-slate-900/40",
                    stage.color
                  )}
                >
                  {/* Stage Header */}
                  <div className={cn("flex items-center justify-between rounded-md px-2.5 py-1.5 mb-2 shadow-2xs font-bold text-xs border border-slate-200/60 dark:border-slate-700/60", stage.headerBg)}>
                    <span className="truncate pr-1">{stage.title}</span>
                    <Badge tone={stage.badgeTone} className="px-1.5 py-0.5 text-[10px] shrink-0 font-mono font-bold">
                      {stageItems.length}
                    </Badge>
                  </div>

                  {/* Candidate Cards Column */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 scrollbar-thin">
                    {stageItems.length === 0 ? (
                      <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-slate-300/70 dark:border-slate-700 p-2 text-center">
                        <p className="text-[10px] font-medium text-slate-400">
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
                              "group relative rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-2.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing space-y-2",
                              isUpdating && "opacity-50 pointer-events-none"
                            )}
                          >
                            {/* Candidate Initials + Name */}
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                                  {applicant.first_name?.[0]}{applicant.last_name?.[0]}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {applicant.first_name} {applicant.last_name}
                                  </h4>
                                  <p className="text-[9px] text-slate-400 font-mono truncate">
                                    {applicant.application_id}
                                  </p>
                                </div>
                              </div>

                              {/* AI Score Badge if present */}
                              {score !== null && (
                                <span className={cn(
                                  "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[9px] font-mono font-bold border",
                                  Number(score) >= 80 && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                                  Number(score) >= 60 && Number(score) < 80 && "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                                  Number(score) < 60 && "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                )}>
                                  {Math.round(Number(score))}%
                                </span>
                              )}
                            </div>

                            {/* Position applied */}
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                              {jobTitle}
                            </p>

                            {/* Controls & Actions */}
                            <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                              {/* Details Button */}
                              <button
                                onClick={() => setSelectedApplicant(applicant)}
                                className="flex items-center font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-[11px] cursor-pointer"
                                title="View Candidate Details"
                              >
                                <Eye size={12} className="mr-1 shrink-0" /> View
                              </button>

                              {/* Quick Stage Move Dropdown */}
                              <div className="w-[115px]" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  size="sm"
                                  value={normalizeStageKey(applicant.status)}
                                  onChange={(e) => moveApplicantStage(applicant.id, e.target.value)}
                                  buttonClassName="h-6 px-1.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md shadow-none border-0"
                                >
                                  {STAGES.map((s) => (
                                    <option key={s.key} value={s.key}>
                                      {s.title}
                                    </option>
                                  ))}
                                </Select>
                              </div>
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
        </div>
      ) : (
        /* ── List / Table View ─────────────────────────────────────────── */
        <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3.5">Candidate</th>
                  <th className="py-3 px-3.5">Target Vacancy</th>
                  <th className="py-3 px-3.5">Current Pipeline Stage</th>
                  <th className="py-3 px-3.5">AI Screening Score</th>
                  <th className="py-3 px-3.5">Applied Date</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {paginatedApplicants.map((applicant) => {
                  const jobTitle =
                    applicant.job_posting?.job_library?.job_title ??
                    applicant.jobPosting?.jobLibrary?.job_title ??
                    applicant.job_posting?.title ??
                    "General Vacancy";

                  const score =
                    applicant.ai_evaluation?.ai_score ??
                    applicant.overall_score ??
                    null;

                  const stageKey = normalizeStageKey(applicant.status);
                  const stageObj = STAGES.find((s) => s.key === stageKey) || STAGES[0];
                  const isUpdating = updatingId === applicant.id;

                  const appliedDate = applicant.created_at
                    ? new Date(applicant.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={applicant.id}
                      className={cn(
                        "hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors group",
                        isUpdating && "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Candidate Name & ID */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs">
                            {applicant.first_name?.[0]}{applicant.last_name?.[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {applicant.first_name} {applicant.last_name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                              <span className="font-mono">{applicant.application_id}</span>
                              {applicant.email && <span>• {applicant.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vacancy */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Briefcase size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{jobTitle}</span>
                        </div>
                      </td>

                      {/* Stage Selector */}
                      <td className="py-2.5 px-3.5">
                        <div className="w-40" onClick={(e) => e.stopPropagation()}>
                          <Select
                            size="sm"
                            value={stageKey}
                            onChange={(e) => moveApplicantStage(applicant.id, e.target.value)}
                            buttonClassName={cn("h-7 text-xs font-semibold rounded-md border", stageObj.headerBg)}
                          >
                            {STAGES.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.title}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>

                      {/* AI Score */}
                      <td className="py-2.5 px-3.5">
                        {score !== null ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-mono font-bold border shadow-2xs",
                                Number(score) >= 80 && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                                Number(score) >= 60 && Number(score) < 80 && "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                                Number(score) < 60 && "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              )}
                            >
                              {Math.round(Number(score))}%
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {Number(score) >= 80 ? "High Fit" : Number(score) >= 60 ? "Medium Fit" : "Low Fit"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Unscored</span>
                        )}
                      </td>

                      {/* Applied Date */}
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>{appliedDate}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openScheduleModal(applicant.id)}
                            className="h-7 px-2 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-md cursor-pointer"
                            title="Schedule Interview Session"
                          >
                            <Calendar size={12} className="mr-1" />
                            <span className="hidden sm:inline">Schedule</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedApplicant(applicant)}
                            className="h-7 px-2.5 text-xs font-medium rounded-md cursor-pointer"
                            title="View Full Profile Details"
                          >
                            <Eye size={12} className="mr-1" />
                            <span>Details</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* List View Pagination Footer */}
          {filteredApplicants.length > pageSize && (
            <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={filteredApplicants.length}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
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

function SummaryCard({ label, value, color, icon: Icon }) {
  const colorMap = {
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/50",
    teal: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-900/50",
  };
  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3 shadow-2xs flex items-center gap-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md border", theme)}>
        {Icon && <Icon size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        <p className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}
