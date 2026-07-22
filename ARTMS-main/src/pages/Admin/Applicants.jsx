import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Clock, XCircle, Mail, Eye, CheckCircle, Trash2, Filter, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { ApplicantDetailModal } from "../../modals";
import applicantService from "../../services/applicantService";

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
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [interviewConfirm, setInterviewConfirm] = useState(null);
  const pageSize = 10;

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
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedId(null);
  };

  const handleReadyForInterview = async () => {
    if (!interviewConfirm) return;
    
    setActionLoading(interviewConfirm.id);
    try {
      await applicantService.readyForInterview(interviewConfirm.id, {
        message: `Congratulations! You have been selected for an interview for the ${interviewConfirm.job_posting?.job_library?.job_title || "position"}.`,
      });
      setInterviewConfirm(null);
      loadApplicants();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async (applicant) => {
    const statusMessages = {
      applied: "Thank you for applying. Your application is under review.",
      ai_screening: "Your application is currently being evaluated by our AI screening system.",
      screening_passed: "Congratulations! You have passed our initial screening.",
      ready_for_interview: "You have been selected for an interview. Our HR team will contact you soon.",
      interview_1: "You are scheduled for the first round of interviews.",
      interview_2: "You have been selected for the second round of interviews.",
      hired: "Congratulations! You have been selected for the position.",
      rejected: "Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.",
    };

    const message = statusMessages[applicant.status] || "Your application status has been updated.";
    
    if (!confirm(`Send email notification to ${applicant.email}?\n\nMessage: "${message}"`)) return;
    
    setActionLoading(applicant.id);
    try {
      await applicantService.update(applicant.id, { send_status_email: true });
      alert("Email sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send email.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setActionLoading(deleteConfirm.id);
    try {
      await applicantService.reject(deleteConfirm.id, { remarks: "Application deleted" });
      setDeleteConfirm(null);
      loadApplicants();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete applicant.");
    } finally {
      setActionLoading(null);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    // For now, use the total count. You can enhance this by fetching separate counts from backend
    return {
      total: total,
      screening: applicants.filter(a => ["applied", "ai_screening", "screening_passed"].includes(a.status)).length,
      interview: applicants.filter(a => ["ready_for_interview", "interview_1", "interview_2"].includes(a.status)).length,
      hired: applicants.filter(a => a.status === "hired").length,
    };
  }, [total, applicants]);

  return (
    <div className="space-y-4">
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
          className="gap-2"
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

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter size={16} />
              Filters:
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    status === s.value
                      ? "border-[#111A62] bg-[#111A62] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-64">
              <SearchBar
                value={q}
                onChange={handleSearch}
                placeholder="Search applicants..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applicants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Applicants ({total} {total === 1 ? "applicant" : "applicants"})
            </CardTitle>
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
              <p className="mt-1 text-xs text-slate-400">
                {q || status !== "all"
                  ? "Try adjusting your search or filters"
                  : "Applications will appear here when candidates apply"}
              </p>
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
                        <TD className="max-w-[180px]">
                          <div className="truncate font-medium text-slate-900">
                            {job?.job_title || "—"}
                          </div>
                          {a.application_id && (
                            <div className="text-xs text-slate-400">{a.application_id}</div>
                          )}
                        </TD>
                        <TD>
                          <StatusChip status={a.status || "applied"} />
                        </TD>
                        <TD>
                          {eval_?.ai_score != null ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-slate-900">
                                {Math.round(eval_.ai_score)}
                              </span>
                              <span className="text-xs text-slate-400">/100</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not screened</span>
                          )}
                        </TD>
                        <TD>
                          {eval_?.fit_label ? (
                            <Badge tone={FIT_TONE[eval_.fit_label]}>
                              {FIT_LABEL[eval_.fit_label]}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TD>
                        <TD className="text-right">
                          <div className="inline-flex gap-1.5">
                            {/* Ready for Interview button - only show if qualified */}
                            {eval_?.hr_decision === "qualified" &&
                              a.status !== "ready_for_interview" &&
                              a.status !== "interview_1" &&
                              a.status !== "interview_2" &&
                              a.status !== "hired" &&
                              a.status !== "rejected" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInterviewConfirm(a);
                                  }}
                                  disabled={actionLoading === a.id}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-green-500 hover:bg-green-50 hover:text-green-600 cursor-pointer disabled:opacity-50"
                                  title="Mark as Ready for Interview"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}

                            {/* Email button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendEmail(a);
                              }}
                              disabled={actionLoading === a.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer disabled:opacity-50"
                              title="Send Status Email"
                            >
                              <Mail size={16} />
                            </button>

                            {/* View Details button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(a.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600 cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(a);
                              }}
                              disabled={actionLoading === a.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer disabled:opacity-50"
                              title="Delete Applicant"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Applicant Detail Modal */}
      <ApplicantDetailModal
        open={modalOpen}
        applicantId={selectedId}
        onClose={handleModalClose}
        onStatusChange={loadApplicants}
      />

      {/* Ready for Interview Confirm Dialog */}
      <ConfirmDialog
        open={!!interviewConfirm}
        title="Mark as Ready for Interview?"
        description={`Are you sure you want to mark ${interviewConfirm?.first_name} ${interviewConfirm?.last_name} as ready for interview? An email notification will be sent to the candidate.`}
        confirmLabel="Yes, Mark Ready"
        cancelLabel="Cancel"
        tone="primary"
        onConfirm={handleReadyForInterview}
        onClose={() => setInterviewConfirm(null)}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Application?"
        description={`Are you sure you want to delete ${deleteConfirm?.first_name} ${deleteConfirm?.last_name}'s application? This action cannot be undone and all applicant data will be removed from the system.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
