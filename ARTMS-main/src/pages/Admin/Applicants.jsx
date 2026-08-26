import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Clock, XCircle, Eye, CheckCircle, Trash2, Filter, RefreshCw, ChevronRight, X, Trophy, Award, Sparkles, SlidersHorizontal, ArrowUpDown, Briefcase, ChevronDown, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import TableSkeleton from "../../components/ui/TableSkeleton";
import CardSkeleton from "../../components/ui/CardSkeleton";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ApplicantViewPanel from "../../components/applicant/ApplicantViewPanel";
import applicantService from "../../services/applicantService";
import jobService from "../../services/jobService";
import { useToast } from "../../context/ToastContext";
import ConfirmationModal from "../../modals/ConfirmationModal";

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "applied", label: "Applied" },
  { value: "ai_screening", label: "AI Screening" },
  { value: "screening_passed", label: "Screening Passed" },
  { value: "ready_for_interview", label: "Ready for Interview" },
  { value: "interview_1", label: "Interview 1" },
  { value: "interview_2", label: "Interview 2" },
  { value: "rejected", label: "Rejected" },
];

const FIT_TONE = { high: "success", medium: "warning", low: "danger" };
const FIT_LABEL = { high: "High Fit", medium: "Medium Fit", low: "Low Fit" };

export default function Applicants() {
  const toast = useToast();
  const [applicants, setApplicants] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedFit, setSelectedFit] = useState("all");
  const [sortBy, setSortBy] = useState("score_desc");
  const [aiTab, setAiTab] = useState("all");
  const [aiSearchQuery, setAiSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Selected Applicant ID for Split View Detail Panel
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);

  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [interviewConfirm, setInterviewConfirm] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const pageSize = 50;

  // Fetch Job Postings for Position Filter Dropdown
  useEffect(() => {
    jobService.postings.getAll({ per_page: 100 })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setJobPostings(list);
      })
      .catch(() => { });
  }, []);

  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: pageSize,
      };
      if (q) params.search = q;
      if (status && status !== "all") params.status = status;
      if (selectedPosition && selectedPosition !== "all" && !isNaN(selectedPosition)) {
        params.job_posting_id = selectedPosition;
      }

      const res = await applicantService.getAll(params);
      const rawList = res.data.data || res.data || [];
      setApplicants(rawList);
      setTotal(res.data.total || rawList.length);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, selectedPosition, pageSize]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const handleSearch = (value) => {
    setQ(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleViewDetails = (id) => {
    setSelectedApplicantId(id);
  };

  const handleReadyForInterview = async () => {
    if (!interviewConfirm) return;

    setActionLoading(`ready_${interviewConfirm.id}`);
    try {
      await applicantService.readyForInterview(interviewConfirm.id, {
        message: `Congratulations! You have been selected for an interview for the ${interviewConfirm.job_posting?.job_library?.job_title || "position"}.`,
      });
      toast.success(
        "Applicant Marked as Ready for Interview",
        `${interviewConfirm.first_name} ${interviewConfirm.last_name} is now ready for interview scheduling.`
      );
      setInterviewConfirm(null);
      await loadApplicants();
    } catch (err) {
      toast.error("Action Failed", err.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setActionLoading(`delete_${deleteConfirm.id}`);
    try {
      await applicantService.delete(deleteConfirm.id);
      toast.success("Application Deleted", `${deleteConfirm.first_name} ${deleteConfirm.last_name}'s application has been removed.`);
      setDeleteConfirm(null);
      await loadApplicants();
    } catch (err) {
      toast.error("Delete Failed", err.response?.data?.message || "Failed to delete applicant.");
    } finally {
      setActionLoading(null);
    }
  };

  // Statistics (all 5 categories including Hired)
  const stats = useMemo(() => {
    return {
      total: applicants.length,
      screening: applicants.filter((a) => ["applied", "ai_screening", "screening_passed"].includes(a.status)).length,
      interview: applicants.filter((a) => ["ready_for_interview", "interview_1", "interview_2"].includes(a.status)).length,
      hired: applicants.filter((a) => a.status === "hired").length,
      rejected: applicants.filter((a) => a.status === "rejected").length,
    };
  }, [applicants]);

  // Unique position list for filter dropdown
  const positionsList = useMemo(() => {
    const map = new Map();
    jobPostings.forEach((p) => {
      const title = p.job_library?.job_title || p.title;
      if (title && p.id) map.set(String(p.id), title);
    });
    applicants.forEach((a) => {
      const title = a.job_posting?.job_library?.job_title || a.job_posting?.title;
      const id = a.job_posting_id || a.job_posting?.id || title;
      if (title && id && !map.has(String(id))) {
        map.set(String(id), title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [jobPostings, applicants]);

  // Department/Position Recommendations for SearchBar Autocomplete
  const aiSearchSuggestions = useMemo(() => {
    const suggestions = [{ id: "all", label: "All Positions", count: applicants.length }];
    const countMap = new Map();

    applicants.forEach((a) => {
      const title = a.job_posting?.job_library?.job_title || a.job_posting?.title;
      if (title) {
        countMap.set(title, (countMap.get(title) || 0) + 1);
      }
    });

    jobPostings.forEach((p) => {
      const title = p.job_library?.job_title || p.title;
      if (title && !countMap.has(title)) {
        countMap.set(title, 0);
      }
    });

    Array.from(countMap.entries()).forEach(([title, count]) => {
      suggestions.push({ id: title, label: title, count });
    });

    return suggestions;
  }, [jobPostings, applicants]);

  // Screened Candidates Ranked by AI Score (Filtered by selected AI Tab / Search recommendation, Top 3)
  const topCandidates = useMemo(() => {
    return applicants
      .filter((a) => {
        const score = a.ai_evaluation?.ai_score ?? a.ai_evaluation?.composite_score;
        if (score == null) return false;

        const activeFilter = (aiTab !== "all" ? aiTab : aiSearchQuery) || "";
        if (activeFilter && activeFilter.trim() !== "" && activeFilter !== "all" && activeFilter !== "All Positions") {
          const queryLower = activeFilter.toLowerCase();
          const posTitle = (a.job_posting?.job_library?.job_title || a.job_posting?.title || "").toLowerCase();
          const posId = String(a.job_posting_id || a.job_posting?.id || "");
          const dept = (a.job_posting?.department?.department_name || a.job_posting?.department?.name || "").toLowerCase();
          return posId === activeFilter || posTitle.includes(queryLower) || dept.includes(queryLower);
        }
        return true;
      })
      .sort((a, b) => {
        const scoreA = Number(a.ai_evaluation?.ai_score ?? a.ai_evaluation?.composite_score ?? 0);
        const scoreB = Number(b.ai_evaluation?.ai_score ?? b.ai_evaluation?.composite_score ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [applicants, aiTab, aiSearchQuery]);

  // Client-side Filtered and Sorted Applicants List (hired applicants excluded)
  const processedApplicants = useMemo(() => {
    let list = applicants.filter((a) => a.status !== "hired");

    // Filter by search (case-insensitive across name, email, position, app ID)
    if (q) {
      const term = q.toLowerCase();
      list = list.filter((a) => {
        const name = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        const email = (a.email || "").toLowerCase();
        const pos = (a.job_posting?.job_library?.job_title || a.job_posting?.title || "").toLowerCase();
        const id = (a.application_id || "").toLowerCase();
        return name.includes(term) || email.includes(term) || pos.includes(term) || id.includes(term);
      });
    }

    // Filter by position applied
    if (selectedPosition !== "all") {
      list = list.filter((a) => {
        const posTitle = a.job_posting?.job_library?.job_title || a.job_posting?.title;
        const posId = String(a.job_posting_id || a.job_posting?.id);
        return posId === String(selectedPosition) || posTitle === selectedPosition;
      });
    }

    // Filter by fit level
    if (selectedFit !== "all") {
      list = list.filter((a) => {
        const fit = (a.ai_evaluation?.fit_label || a.fit_category || "").toLowerCase();
        if (selectedFit === "unscreened") {
          return !a.ai_evaluation && !a.fit_category;
        }
        return fit === selectedFit;
      });
    }

    // Filter by status
    if (status !== "all") {
      list = list.filter((a) => {
        if (status === "interview_1") return ["interview_1", "interview_1_scheduled", "interview_1_done"].includes(a.status);
        if (status === "interview_2") return ["interview_2", "interview_2_scheduled", "interview_2_done"].includes(a.status);
        if (status === "ai_screening") return ["ai_screening", "under_review"].includes(a.status);
        if (status === "screening_passed") return ["screening_passed", "shortlisted"].includes(a.status);
        return a.status === status;
      });
    }

    // Sort
    list.sort((a, b) => {
      const scoreA = Number(a.ai_evaluation?.ai_score ?? a.ai_evaluation?.composite_score ?? -1);
      const scoreB = Number(b.ai_evaluation?.ai_score ?? b.ai_evaluation?.composite_score ?? -1);

      if (sortBy === "score_desc") return scoreB - scoreA;
      if (sortBy === "score_asc") return scoreA - scoreB;
      if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return 0;
    });

    return list;
  }, [applicants, q, selectedPosition, selectedFit, status, sortBy]);

  const isFiltered = q || status !== "all" || selectedPosition !== "all" || selectedFit !== "all" || sortBy !== "score_desc";

  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setSelectedPosition("all");
    setSelectedFit("all");
    setSortBy("score_desc");
    setPage(1);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await applicantService.bulkDelete(selectedIds);
      toast.success("Bulk Deletion Complete", res.data?.message || `Successfully deleted ${selectedIds.length} applicants.`);
      setSelectedIds([]);
      loadApplicants();
      window.dispatchEvent(new CustomEvent("artms-refresh-sidebar"));
    } catch (err) {
      toast.error("Bulk Deletion Failed", err.response?.data?.message || "Failed to delete selected applicants.");
    } finally {
      setBulkDeleting(false);
      setBulkDeleteConfirm(false);
    }
  };

  const handleToggleSelectAll = (items) => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((a) => a.id));
    }
  };

  const handleToggleSelectOne = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Title, Stats & AI Leaderboard Container ───── */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
              Recruitment
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
              Applicant Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View and manage all job applications • AI-powered screening
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkDeleting}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold animate-fade-in cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Selected ({selectedIds.length})</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={loadApplicants}
              disabled={loading}
              className="gap-2 bg-white cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── Row 1: Statistics Cards (5-Column Responsive Grid) ────── */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatFilterCard
            title="Total Applicants"
            value={stats.total}
            icon={<Users size={22} />}
            accentColor="navy"
            active={status === "all"}
            onClick={() => handleStatusChange("all")}
          />

          <StatFilterCard
            title="In Screening"
            value={stats.screening}
            icon={<Clock size={22} />}
            accentColor="amber"
            active={["applied", "ai_screening", "screening_passed"].includes(status)}
            onClick={() => handleStatusChange("ai_screening")}
          />

          <StatFilterCard
            title="In Interview"
            value={stats.interview}
            icon={<UserCheck size={22} />}
            accentColor="purple"
            active={["ready_for_interview", "interview_1", "interview_2"].includes(status)}
            onClick={() => handleStatusChange("ready_for_interview")}
          />

          <StatFilterCard
            title="Hired"
            value={stats.hired}
            icon={<CheckCircle size={22} />}
            accentColor="emerald"
            active={status === "hired"}
            onClick={() => handleStatusChange("hired")}
          />

          <StatFilterCard
            title="Rejected"
            value={stats.rejected}
            icon={<XCircle size={22} />}
            accentColor="rose"
            active={status === "rejected"}
            onClick={() => handleStatusChange("rejected")}
          />
        </div>

        {/* ── Row 2: Top AI-Ranked Candidates (Full-Width White Card Container) ──── */}
        <Card className="w-full border border-slate-200/90 bg-white dark:bg-[#0F163D] dark:border-slate-800 text-slate-900 dark:text-white shadow-xl shadow-slate-200/50 rounded-3xl relative">
          {/* Background Layer with Overflow Hidden for Blobs */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-[#E15B1D]/15 blur-3xl" />
            <div className="absolute left-1/4 bottom-0 -mb-16 h-48 w-48 rounded-full bg-[#111A62]/40 blur-2xl" />
          </div>

          {/* Header with Title & Position Search with Recommendations */}
          <CardHeader className="pb-4 pt-5 px-6 border-b border-slate-100 dark:border-slate-800 relative z-30 bg-slate-50/50 dark:bg-slate-900/30 rounded-t-3xl">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E15B1D]/15 text-[#E15B1D] ring-1 ring-[#E15B1D]/30 shadow-xs">
                  <Trophy size={22} />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-[#111A62] dark:text-white flex items-center gap-2">
                    Top AI-Ranked Candidates <Sparkles size={16} className="text-[#E15B1D] shrink-0" />
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Auto-ranked by AI composite score & resume screening
                  </p>
                </div>
              </div>

              {/* Position Recommendation SearchBar */}
              <div className="w-full xl:w-72">
                <SearchBar
                  value={aiSearchQuery}
                  onChange={(val) => {
                    setAiSearchQuery(val);
                    if (!val) setAiTab("all");
                  }}
                  onSelectSuggestion={(item) => {
                    const selectedId = typeof item === "string" ? item : item.id || item.label;
                    setAiTab(selectedId);
                    setAiSearchQuery(selectedId === "all" ? "" : (typeof item === "string" ? item : item.label));
                  }}
                  suggestions={aiSearchSuggestions}
                  placeholder="Search position recommendation..."
                  className="h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xs"
                />
              </div>
            </div>
          </CardHeader>

          {/* Content: 3-column grid of Navy Blue Candidate Boxes */}
          <CardContent className="p-5 sm:p-6 relative z-10">
            {topCandidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topCandidates.map((a, index) => {
                  const scoreVal = Math.round(Number(a.ai_evaluation?.ai_score ?? a.ai_evaluation?.composite_score ?? 0));
                  const fitLabel = a.ai_evaluation?.fit_label || a.fit_category || "high";
                  const name = `${a.first_name || ""} ${a.last_name || ""}`;
                  const pos = a.job_posting?.job_library?.job_title || a.job_posting?.title || "Position Unspecified";
                  const dept = a.job_posting?.department?.department_name || a.job_posting?.department?.name;
                  const rankText = index === 0 ? "🥇 #1 Top" : index === 1 ? "🥈 #2 High" : "🥉 #3 Rank";
                  const rankStyle = index === 0 
                    ? "bg-[#E15B1D]/30 text-[#F97316] border-[#E15B1D]/50 ring-1 ring-[#E15B1D]/30" 
                    : index === 1 
                    ? "bg-blue-400/20 text-blue-300 border-blue-400/40" 
                    : "bg-slate-400/20 text-slate-300 border-slate-400/40";

                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedApplicantId(a.id)}
                      className="group rounded-2xl bg-[#111A62] text-white p-4 border border-slate-800/40 hover:border-[#E15B1D]/70 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 shadow-md shadow-[#111A62]/10 hover:shadow-xl hover:shadow-[#111A62]/20 hover:scale-[1.01]"
                    >
                      {/* Candidate Info Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E2B8F] to-[#E15B1D] text-xs font-black text-white ring-1 ring-white/20 shadow-xs">
                            {(a.first_name?.[0] || "") + (a.last_name?.[0] || "")}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-white truncate group-hover:text-[#F97316] transition">
                              {name}
                            </p>
                            <p className="text-xs text-slate-300 truncate mt-0.5">{pos}</p>
                            {dept && <p className="text-[10px] text-slate-400 truncate">{dept}</p>}
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rankStyle} shrink-0`}>
                          {rankText}
                        </span>
                      </div>

                      {/* Badges and Score Footer */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#F97316] bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/15 font-mono">
                            {scoreVal}%
                          </span>
                          <Badge tone={FIT_TONE[fitLabel] || "success"} className="text-[10px] uppercase font-extrabold px-2 py-0.5">
                            {FIT_LABEL[fitLabel] || fitLabel}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-bold text-white group-hover:text-[#F97316] transition flex items-center gap-1 cursor-pointer"
                        >
                          View <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="h-10 w-10 rounded-2xl bg-[#E15B1D]/10 text-[#E15B1D] flex items-center justify-center mb-2">
                  <Trophy size={20} />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">No AI-ranked candidates in this category</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Select another position from the search bar or run AI Resume Screening to generate scores.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Split-Screen Master-Detail Layout ──────────────────────── */}
      <div className={`grid gap-5 transition-all duration-300 lg:grid-cols-12 ${selectedApplicantId ? "h-[calc(100vh-8.5rem)] min-h-[550px]" : ""}`}>

        {/* ── LEFT SIDE: DIRECTORY (Full Table or Sidebar List) ────── */}
        <div className={`transition-all duration-300 ${selectedApplicantId ? "lg:col-span-4 h-full min-h-0" : "lg:col-span-12"}`}>

          {selectedApplicantId ? (
            /* ── COMPACT SIDEBAR LIST (When Applicant Panel is open) ── */
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 animate-fade-in flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Candidates Directory</h3>
                  <p className="text-[11px] text-slate-400">Click candidate to view 360 profile</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedApplicantId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    title="Expand to Full Table"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2 shrink-0">
                <SearchBar
                  value={q}
                  onChange={handleSearch}
                  placeholder="Search name, position..."
                  className="text-xs"
                />

                <div className="grid gap-2 sm:grid-cols-2">
                  <Select
                    icon={Briefcase}
                    size="sm"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    buttonClassName="bg-slate-50 hover:bg-white"
                  >
                    <option value="all">All Positions Applied</option>
                    {positionsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </Select>

                  <Select
                    icon={SlidersHorizontal}
                    size="sm"
                    value={selectedFit}
                    onChange={(e) => setSelectedFit(e.target.value)}
                    buttonClassName="bg-slate-50 hover:bg-white"
                  >
                    <option value="all">All Fit Levels</option>
                    <option value="high">High Fit</option>
                    <option value="medium">Medium Fit</option>
                    <option value="low">Low Fit</option>
                    <option value="unscreened">Unscreened</option>
                  </Select>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={`rounded-full px-2.5 py-0.5 border transition cursor-pointer shrink-0 ${status === s.value
                          ? "bg-[#111A62] text-white border-[#111A62]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar List Cards */}
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex flex-col gap-2">
                    <CardSkeleton count={4} className="!grid-cols-1" />
                  </div>
                ) : processedApplicants.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No applicants match filter.</div>
                ) : (
                  processedApplicants.map((a) => {
                    const isSelected = a.id === selectedApplicantId;
                    const name = `${a.first_name || ""} ${a.last_name || ""}`;
                    const pos = a.job_posting?.job_library?.job_title || a.job_posting?.title || "Position Unspecified";

                    const isChecked = selectedIds.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => setSelectedApplicantId(a.id)}
                        className={`p-3 rounded-2xl transition cursor-pointer border ${isSelected
                            ? "border-[#111A62] bg-[#111A62]/10 ring-2 ring-[#111A62]/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleSelectOne(a.id, e)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-3.5 w-3.5 cursor-pointer shrink-0"
                            />
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isSelected ? "bg-[#111A62] text-white" : "bg-slate-100 text-[#111A62]"
                              }`}>
                              {(a.first_name?.[0] || "") + (a.last_name?.[0] || "")}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-xs font-extrabold truncate ${isSelected ? "text-[#111A62]" : "text-slate-900"}`}>
                                {name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{pos}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-1">
                          <StatusChip status={a.status} className="text-[9px]" />
                          {(a.ai_evaluation?.fit_label || a.fit_category) && (
                            <Badge tone={FIT_TONE[a.ai_evaluation?.fit_label || a.fit_category] || "default"} className="text-[9px] px-1.5 py-0.2 capitalize">
                              {FIT_LABEL[a.ai_evaluation?.fit_label || a.fit_category] || (a.ai_evaluation?.fit_label || a.fit_category)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ── FULL TABLE DIRECTORY (When no candidate is open) ───── */
            <Card className="animate-fade-in transition-all duration-300">
              <CardHeader className="py-4 border-b border-slate-100">
                <div className="flex flex-col gap-4">
                  {/* Top Row: Title & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="text-[#111A62]" size={18} /> Applicants Directory ({processedApplicants.length})
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-2">
                      {isFiltered && (
                        <button
                          onClick={resetFilters}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                          title="Reset Filters"
                        >
                          <X size={14} /> Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Search & Filters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                    <div className="lg:col-span-2">
                      <SearchBar
                        value={q}
                        onChange={handleSearch}
                        placeholder="Search candidate name or position..."
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="col-span-1">
                      <Select
                        icon={Briefcase}
                        size="md"
                        value={selectedPosition}
                        onChange={(e) => {
                          setSelectedPosition(e.target.value);
                          setPage(1);
                        }}
                        buttonClassName="bg-slate-50 hover:bg-white h-10 w-full"
                      >
                        <option value="all">All Positions</option>
                        {positionsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Select
                        icon={SlidersHorizontal}
                        size="md"
                        value={selectedFit}
                        onChange={(e) => {
                          setSelectedFit(e.target.value);
                          setPage(1);
                        }}
                        buttonClassName="bg-slate-50 hover:bg-white h-10 w-full"
                      >
                        <option value="all">All Fit Levels</option>
                        <option value="high">High Fit</option>
                        <option value="medium">Medium Fit</option>
                        <option value="low">Low Fit</option>
                        <option value="unscreened">Unscreened</option>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Select
                        icon={Filter}
                        size="md"
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        buttonClassName="bg-slate-50 hover:bg-white h-10 w-full"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Select
                        icon={ArrowUpDown}
                        size="md"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        buttonClassName="bg-slate-50 hover:bg-white h-10 w-full"
                      >
                        <option value="score_desc">AI Score: Hi to Lo</option>
                        <option value="score_asc">AI Score: Lo to Hi</option>
                        <option value="newest">Applied: Newest</option>
                        <option value="oldest">Applied: Oldest</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === processedApplicants.length && processedApplicants.length > 0}
                          onChange={() => handleToggleSelectAll(processedApplicants)}
                          className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-4 w-4 cursor-pointer"
                          title="Select all on this page"
                        />
                      </TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Position Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Fit Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-4">
                          <TableSkeleton rows={10} />
                        </TableCell>
                      </TableRow>
                    ) : processedApplicants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center">
                          <Users size={48} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">No applicants found</p>
                          {isFiltered && (
                            <button
                              onClick={resetFilters}
                              className="mt-3 text-xs font-bold text-[#111A62] underline hover:text-[#1a257c]"
                            >
                              Reset active filters
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      processedApplicants.map((a) => {
                        const eval_ = a.ai_evaluation;
                        const job = a.job_posting?.job_library;
                        const isChecked = selectedIds.includes(a.id);
                        return (
                          <TableRow
                            key={a.id}
                            className={`cursor-pointer transition ${isChecked ? "bg-blue-50/40" : ""}`}
                            onClick={() => handleViewDetails(a.id)}
                          >
                            <TableCell className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleToggleSelectOne(a.id, e)}
                                className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-4 w-4 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                                  {a.first_name?.charAt(0)}{a.last_name?.charAt(0)}
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {a.first_name} {a.last_name}
                                  </p>
                                  <p className="text-xs text-slate-400">{a.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold text-slate-900">{job?.job_title || "Unspecified"}</p>
                            </TableCell>
                            <TableCell>
                              <StatusChip status={a.status} />
                            </TableCell>
                            <TableCell>
                              {eval_?.ai_score != null ? (
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {Math.round(Number(eval_.ai_score))}%
                                </span>
                              ) : eval_?.composite_score != null ? (
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {Math.round(Number(eval_.composite_score))}%
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {(eval_?.fit_label || a.fit_category) ? (
                                <Badge tone={FIT_TONE[eval_?.fit_label || a.fit_category] || "default"} className="capitalize">
                                  {FIT_LABEL[eval_?.fit_label || a.fit_category] || (eval_?.fit_label || a.fit_category)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(a.id);
                                }}
                                className="flex items-center justify-end gap-1 text-xs text-[#111A62] font-bold hover:bg-[#111A62]/10 px-2 py-1 rounded-lg transition cursor-pointer ml-auto"
                              >
                                <Eye size={14} /> View Candidate <ChevronRight size={14} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {!loading && total > 10 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT SIDE: CANDIDATE 360 PANEL (Smooth Slide In) ──────── */}
        {selectedApplicantId && (
          <div className="lg:col-span-8 animate-slide-up transition-all duration-300 h-full min-h-0">
            <ApplicantViewPanel
              applicantId={selectedApplicantId}
              onClose={() => setSelectedApplicantId(null)}
              onUpdated={loadApplicants}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Applicant"
        description={`Are you sure you want to delete ${deleteConfirm?.first_name} ${deleteConfirm?.last_name}'s application? This action cannot be undone.`}
        confirmText="Delete Application"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Delete Selected Applicants"
        description={`Are you sure you want to permanently delete all ${selectedIds.length} selected applicant(s)? This action cannot be undone.`}
        confirmText={bulkDeleting ? "Deleting..." : "Delete Selected"}
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />

      {/* Ready for Interview Confirmation Modal */}
      <ConfirmationModal
        open={!!interviewConfirm}
        onClose={() => setInterviewConfirm(null)}
        onConfirm={handleReadyForInterview}
        title="Mark Ready for Interview?"
        description={`Are you sure you want to mark ${interviewConfirm?.first_name} ${interviewConfirm?.last_name} as Ready for Interview?`}
        confirmText="Mark Ready & Notify"
        loading={actionLoading === `ready_${interviewConfirm?.id}`}
      />
    </div>
  );
}

function StatFilterCard({ title, value, icon, accentColor, active, onClick }) {
  const colorMap = {
    navy: { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-600 dark:text-emerald-400" },
    purple: { bg: "bg-purple-100 dark:bg-purple-950/60", text: "text-purple-600 dark:text-purple-400" },
    orange: { bg: "bg-orange-100 dark:bg-orange-950/60", text: "text-orange-600 dark:text-orange-400" },
    indigo: { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-600 dark:text-indigo-400" },
    teal: { bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-600 dark:text-teal-400" },
    amber: { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-600 dark:text-amber-400" },
    rose: { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-600 dark:text-rose-400" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl h-full p-[1.5px] transition-all duration-300 cursor-pointer ${
        active
          ? "bg-gradient-to-r from-[#111A62] to-[#E15B1D] shadow-md shadow-[#111A62]/15 scale-[1.02]"
          : "bg-slate-200 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-[#111A62] hover:to-[#E15B1D] hover:shadow-lg hover:shadow-[#111A62]/10"
      }`}
    >
      <Card className="h-full rounded-[10px] border-0 bg-white dark:bg-[#0F163D]">
        <CardContent className="flex items-center gap-3.5 p-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
            <div className={theme.text}>
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="text-2xl font-extrabold text-[#111A62] dark:text-white leading-none mt-1">{value}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
