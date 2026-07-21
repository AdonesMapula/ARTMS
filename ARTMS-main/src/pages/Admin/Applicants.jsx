import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEye, FiMail, FiCheckCircle, FiRefreshCw, FiLoader, FiTrash2 } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import { ApplicantDetailModal } from "../../modals";
import applicantService from "../../services/applicantService";

const STATUSES = [
  { value: "all", label: "All" },
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
const FIT_LABEL = { high: "High", medium: "Medium", low: "Low" };

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

  const handleReadyForInterview = async (applicant, e) => {
    e.stopPropagation();
    if (!confirm(`Mark ${applicant.first_name} ${applicant.last_name} as ready for interview?`)) return;
    
    setActionLoading(applicant.id);
    try {
      await applicantService.readyForInterview(applicant.id, {
        message: `Congratulations! You have been selected for an interview for the ${applicant.job_posting?.job_library?.job_title || "position"}.`,
      });
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

  const handleDelete = async (applicant) => {
    if (!confirm(`Are you sure you want to delete ${applicant.first_name} ${applicant.last_name}'s application?\n\nThis action cannot be undone.`)) return;
    
    setActionLoading(applicant.id);
    try {
      await applicantService.reject(applicant.id, { remarks: "Application deleted" });
      alert("Applicant deleted successfully.");
      loadApplicants();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete applicant.");
    } finally {
      setActionLoading(null);
    }
  };

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = { all: total };
    STATUSES.forEach(s => {
      if (s.value !== "all") counts[s.value] = 0;
    });
    return counts;
  }, [total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Applicants</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Applicant Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} applicant{total !== 1 ? "s" : ""} found • Ranked by AI score
          </p>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          onClick={loadApplicants}
          disabled={loading}
          className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-4"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStatusChange(s.value)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              status === s.value
                ? "border-[var(--artms-primary)] bg-[var(--artms-primary)] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s.label}
            {statusCounts[s.value] !== undefined && (
              <span className="ml-1.5 opacity-75">({statusCounts[s.value]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Applicants</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar
                value={q}
                onChange={handleSearch}
                placeholder="Search by name, email, application ID…"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <FiLoader size={20} className="animate-spin" />
              <span className="text-sm">Loading applicants...</span>
            </div>
          ) : applicants.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              {q || status !== "all"
                ? "No applicants match your search."
                : "No applicants yet. Applications will appear here."}
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
                    <TH>Fit</TH>
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
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                              {a.first_name?.charAt(0)}{a.last_name?.charAt(0)}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {a.first_name} {a.last_name}
                              </p>
                              <p className="text-xs text-slate-400">{a.application_id}</p>
                            </div>
                          </div>
                        </TD>
                        <TD className="max-w-[180px] truncate text-slate-600">
                          {job?.job_title || "—"}
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
                          <div className="flex items-center justify-end gap-2">
                            {/* Ready for Interview button - only show if qualified and not already in interview/hired/rejected */}
                            {eval_?.hr_decision === "qualified" &&
                              a.status !== "ready_for_interview" &&
                              a.status !== "interview_1" &&
                              a.status !== "interview_2" &&
                              a.status !== "hired" &&
                              a.status !== "rejected" && (
                                <button
                                  onClick={(e) => handleReadyForInterview(a, e)}
                                  disabled={actionLoading === a.id}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
                                  title="Mark as Ready for Interview"
                                >
                                  {actionLoading === a.id ? (
                                    <FiLoader size={14} className="animate-spin" />
                                  ) : (
                                    <FiCheckCircle size={14} />
                                  )}
                                </button>
                              )}

                            {/* Email button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendEmail(a);
                              }}
                              disabled={actionLoading === a.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                              title="Send Status Email"
                            >
                              <FiMail size={14} />
                            </button>

                            {/* View Details button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(a.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                              title="View Details"
                            >
                              <FiEye size={14} />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(a);
                              }}
                              disabled={actionLoading === a.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              title="Delete Applicant"
                            >
                              <FiTrash2 size={14} />
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
    </div>
  );
}
