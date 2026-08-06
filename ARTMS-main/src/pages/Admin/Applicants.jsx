import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Clock, XCircle, Eye, CheckCircle, Trash2, Filter, RefreshCw, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ApplicantViewPanel from "../../components/applicant/ApplicantViewPanel";
import applicantService from "../../services/applicantService";
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
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const FIT_TONE = { high: "success", medium: "warning", low: "danger" };
const FIT_LABEL = { high: "High Fit", medium: "Medium Fit", low: "Low Fit" };

export default function Applicants() {
  const toast = useToast();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Selected Applicant ID for Split View Detail Panel
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [interviewConfirm, setInterviewConfirm] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    const handleScroll = () => {
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 150;
      if (isScrollable && window.scrollY > 100) {
        setIsScrolled(true);
      } else if (window.scrollY < 20) {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

      const res = await applicantService.getAll(params);
      setApplicants(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, pageSize]);

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

  // Statistics
  const stats = useMemo(() => {
    return {
      total: total,
      screening: applicants.filter(a => ["applied", "ai_screening", "screening_passed"].includes(a.status)).length,
      interview: applicants.filter(a => ["ready_for_interview", "interview_1", "interview_2"].includes(a.status)).length,
      hired: applicants.filter(a => a.status === "hired").length,
    };
  }, [total, applicants]);

  return (
    <div className="space-y-6">
      {/* ── Collapsible Title & Stats Container ─────────────────────── */}
      <div className={`transition-all duration-500 ease-in-out ${isScrolled ? "max-h-0 opacity-0 overflow-hidden pointer-events-none -translate-y-4 space-y-0" : "max-h-[600px] opacity-100 translate-y-0 space-y-6"}`}>
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
          <Button
            variant="outline"
            onClick={loadApplicants}
            disabled={loading}
            className="gap-2 bg-white"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Total Applicants</p>
                <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">In Screening</p>
                <p className="text-2xl font-extrabold text-slate-900">{stats.screening}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <UserCheck size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">In Interview</p>
                <p className="text-2xl font-extrabold text-slate-900">{stats.interview}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Hired</p>
                <p className="text-2xl font-extrabold text-slate-900">{stats.hired}</p>
              </div>
            </CardContent>
          </Card>
        </div>
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
                  {isScrolled && (
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="rounded-lg border border-[#111A62]/20 bg-[#111A62]/5 px-2 py-1 text-[10px] font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-0.5 cursor-pointer"
                      title="Scroll to top"
                    >
                      ↑ Stats
                    </button>
                  )}
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

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={`rounded-full px-2.5 py-0.5 border transition cursor-pointer shrink-0 ${
                        status === s.value
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
                  <div className="py-10 text-center text-xs text-slate-400">Loading candidates...</div>
                ) : applicants.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No applicants match filter.</div>
                ) : (
                  applicants.map((a) => {
                    const isSelected = a.id === selectedApplicantId;
                    const name = `${a.first_name || ""} ${a.last_name || ""}`;
                    const pos = a.job_posting?.job_library?.job_title || "Position Unspecified";

                    return (
                      <div
                        key={a.id}
                        onClick={() => setSelectedApplicantId(a.id)}
                        className={`p-3 rounded-2xl transition cursor-pointer border ${
                          isSelected
                            ? "border-[#111A62] bg-[#111A62]/10 ring-2 ring-[#111A62]/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                            isSelected ? "bg-[#111A62] text-white" : "bg-slate-100 text-[#111A62]"
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
            <Card className={`animate-fade-in transition-all duration-300 ${isScrolled && !selectedApplicantId ? "sticky top-4 z-20 shadow-2xl ring-1 ring-slate-900/10 border-slate-300 bg-white" : ""}`}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="text-[#111A62]" size={18} /> Applicants Directory ({total})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {isScrolled && !selectedApplicantId && (
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="rounded-lg border border-[#111A62]/20 bg-[#111A62]/5 px-2.5 py-1 text-xs font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-1 cursor-pointer mr-2"
                        title="Scroll to top"
                      >
                        ↑ Show Header & Stats
                      </button>
                    )}
                    <div className="w-60">
                      <SearchBar
                        value={q}
                        onChange={handleSearch}
                        placeholder="Search applicants..."
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No applicants found</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <THead>
                        <tr>
                          <TH>Applicant</TH>
                          <TH>Position Applied</TH>
                          <TH>Status</TH>
                          <TH>AI Score</TH>
                          <TH>Fit Level</TH>
                          <TH className="text-right">Actions</TH>
                        </tr>
                      </THead>
                      <tbody>
                        {applicants.map((a) => {
                          const eval_ = a.ai_evaluation;
                          const job = a.job_posting?.job_library;
                          return (
                            <tr
                              key={a.id}
                              className="cursor-pointer transition hover:bg-slate-50"
                              onClick={() => handleViewDetails(a.id)}
                            >
                              <TD>
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
                              </TD>
                              <TD>
                                <p className="font-semibold text-slate-900">{job?.job_title || "Unspecified"}</p>
                              </TD>
                              <TD>
                                <StatusChip status={a.status} />
                              </TD>
                              <TD>
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
                              </TD>
                              <TD>
                                {(eval_?.fit_label || a.fit_category) ? (
                                  <Badge tone={FIT_TONE[eval_?.fit_label || a.fit_category] || "default"} className="capitalize">
                                    {FIT_LABEL[eval_?.fit_label || a.fit_category] || (eval_?.fit_label || a.fit_category)}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </TD>
                              <TD className="text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(a.id);
                                  }}
                                  className="flex items-center gap-1 text-xs text-[#111A62] font-bold hover:bg-[#111A62]/10 px-2 py-1 rounded-lg transition cursor-pointer"
                                >
                                  <Eye size={14} /> View Candidate <ChevronRight size={14} />
                                </button>
                              </TD>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>

                    {total > 10 && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <Pagination
                          page={page}
                          pageSize={pageSize}
                          total={total}
                          onPageChange={setPage}
                        />
                      </div>
                    )}
                  </>
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
