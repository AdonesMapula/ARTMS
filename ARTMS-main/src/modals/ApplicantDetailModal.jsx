import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Calendar, FileText, ChevronDown, X } from "lucide-react";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import applicantService from "../services/applicantService";

const FIT_TONE = { high: "success", medium: "warning", low: "danger" };
const FIT_LABEL = { high: "High", medium: "Medium", low: "Low" };
const STATUS_TONE = {
  applied: "info",
  ai_screening: "warning",
  screening_passed: "accent",
  interview_scheduled: "accent",
  interview_1: "accent",
  interview_2: "accent",
  ready_for_interview: "success",
  hired: "success",
  rejected: "danger",
};

const BREAKDOWN_FIELDS = [
  { key: "education", label: "Education", max: 25 },
  { key: "experience", label: "Experience", max: 35 },
  { key: "skills", label: "Skills", max: 30 },
  { key: "other", label: "Other / License", max: 10 },
];

function scoreColor(pct) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function fitRingColor(label) {
  if (label === "high") return "border-emerald-300 text-emerald-600";
  if (label === "medium") return "border-amber-300 text-amber-600";
  return "border-red-300 text-red-600";
}

export default function ApplicantDetailModal({ open, applicantId, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (open && applicantId) {
      loadApplicant();
    }
  }, [open, applicantId]);

  const loadApplicant = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await applicantService.getById(applicantId);
      setData(res.data.applicant);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applicant details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!data) return;
    setShowStatusMenu(false);
    setActionLoading("status");
    
    try {
      await applicantService.update(data.id, { status: newStatus });
      if (onStatusChange) onStatusChange();
      loadApplicant();
      alert("Status updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!data || !confirm("Reject this applicant?")) return;
    setActionLoading("reject");
    try {
      await applicantService.reject(data.id, { remarks: "Did not meet requirements" });
      if (onStatusChange) onStatusChange();
      loadApplicant();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject applicant.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!open) return null;

  const applicant = data;
  const eval_ = applicant?.ai_evaluation;
  const job = applicant?.job_posting?.job_library;

  return (
    <Modal open={open} onClose={onClose} className="max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900">
              {loading ? "Loading..." : applicant ? `${applicant.first_name} ${applicant.last_name}` : "Applicant Details"}
            </h2>
            {applicant && (
              <div className="mt-1 flex items-center gap-3">
                <p className="text-sm text-slate-500">{applicant.application_id}</p>
                <Badge tone={STATUS_TONE[applicant.status] || "default"}>
                  {applicant.status?.replace(/_/g, " ") || "Applied"}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Action Buttons in Header */}
          {applicant && !loading && (
            <div className="flex items-center gap-2">
              {/* Download Resume */}
              {applicant.resume_path && (
                <button
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  title="Download Resume"
                >
                  <FileText size={14} />
                  Download
                </button>
              )}
              
              {/* Reject Button */}
              {applicant.status !== "hired" && applicant.status !== "rejected" && (
                <button
                  onClick={handleReject}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  title="Reject Applicant"
                >
                  <X size={14} />
                  Reject
                </button>
              )}
              
              {/* Change Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Change Status
                  <ChevronDown size={14} />
                </button>
                
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="p-2">
                        {[
                          { value: "applied", label: "Applied" },
                          { value: "ai_screening", label: "AI Screening" },
                          { value: "screening_passed", label: "Screening Passed" },
                          { value: "ready_for_interview", label: "Ready for Interview" },
                          { value: "interview_1", label: "Interview 1" },
                          { value: "interview_2", label: "Interview 2" },
                          { value: "hired", label: "Hired" },
                          { value: "rejected", label: "Rejected" },
                        ].map((status) => (
                          <button
                            key={status.value}
                            onClick={() => handleStatusChange(status.value)}
                            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              applicant.status === status.value
                                ? "bg-[#111A62] text-white"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5" style={{ maxHeight: "calc(80vh - 160px)", overflowY: "auto" }}>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#111A62]"></div>
            <span className="ml-3 text-sm">Loading details...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : !applicant ? (
          <div className="py-12 text-center text-slate-400">No applicant data</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            
            {/* Left Column - Contact & Basic Info */}
            <div className="space-y-4 lg:col-span-1">
              {/* Contact Information */}
              <Card>
                <CardContent className="space-y-3 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Information</p>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <Mail size={14} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="text-sm text-slate-700">{applicant.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="shrink-0 text-slate-400" />
                      <span className="text-sm text-slate-700">{applicant.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="text-sm text-slate-700">{applicant.address || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="shrink-0 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        {applicant.date_of_birth ? new Date(applicant.date_of_birth).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Details */}
              <Card>
                <CardContent className="space-y-3 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Details</p>
                  <div className="grid gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Gender</p>
                      <p className="text-sm font-medium text-slate-700">{applicant.gender || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Civil Status</p>
                      <p className="text-sm font-medium text-slate-700">{applicant.civil_status || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Nationality</p>
                      <p className="text-sm font-medium text-slate-700">{applicant.nationality || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Position Applied */}
              <Card>
                <CardContent className="space-y-2 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Position Applied</p>
                  <p className="text-base font-semibold text-slate-900">{job?.job_title || "—"}</p>
                  {job?.department && (
                    <p className="text-xs text-slate-500">{job.department}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - AI Evaluation */}
            <div className="space-y-4 lg:col-span-2">
              {eval_ ? (
                <>
                  {/* AI Score Overview */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-5">
                        <div
                          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 bg-white text-3xl font-extrabold ${fitRingColor(
                            eval_.fit_label
                          )}`}
                        >
                          {Math.round(eval_.ai_score ?? 0)}
                        </div>
                        <div className="space-y-2">
                          <Badge tone={FIT_TONE[eval_.fit_label] || "default"} className="text-sm">
                            {FIT_LABEL[eval_.fit_label] || "—"} Fit
                          </Badge>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>
                              <span className="font-semibold">Confidence:</span>{" "}
                              <strong className="text-slate-900">{Math.round(eval_.confidence_level ?? 0)}%</strong>
                            </p>
                            <p>
                              <span className="font-semibold">Qualification Match:</span>{" "}
                              <strong className="text-slate-900">{Math.round(eval_.qualification_match ?? 0)}%</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Breakdown */}
                  <Card>
                    <CardContent className="space-y-3 pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Score Breakdown</p>
                      {BREAKDOWN_FIELDS.map(({ key, label, max }) => {
                        const raw = eval_.score_breakdown?.[key] ?? 0;
                        const pct = Math.min(100, (raw / max) * 100);
                        return (
                          <div key={key}>
                            <div className="mb-1.5 flex justify-between text-sm">
                              <span className="font-semibold text-slate-700">{label}</span>
                              <span className="font-bold text-slate-900">
                                {raw}
                                <span className="font-normal text-slate-400">/{max}</span>
                              </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${scoreColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  {((eval_.skills_matched?.length ?? 0) > 0 || (eval_.skills_missing?.length ?? 0) > 0) && (
                    <Card>
                      <CardContent className="space-y-3 pt-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills Analysis</p>
                        {eval_.skills_matched?.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-emerald-700">✓ Matched Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {eval_.skills_matched.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {eval_.skills_missing?.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-red-600">✗ Missing Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {eval_.skills_missing.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Summary & Feedback */}
                  {(eval_.ai_summary || eval_.ai_feedback) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {eval_.ai_summary && (
                        <Card>
                          <CardContent className="pt-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-500">AI Summary</p>
                            <p className="text-xs leading-relaxed text-slate-600">{eval_.ai_summary}</p>
                          </CardContent>
                        </Card>
                      )}
                      {eval_.ai_feedback && (
                        <Card>
                          <CardContent className="pt-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">Feedback</p>
                            <p className="text-xs leading-relaxed text-slate-600">{eval_.ai_feedback}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* HR Decision */}
                  {eval_.hr_decision && (
                    <Card>
                      <CardContent className="pt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">HR Decision</p>
                        <Badge tone={eval_.hr_decision === "qualified" ? "success" : "danger"} className="mb-2">
                          {eval_.hr_decision === "qualified" ? "✓ Qualified" : "✗ Not Qualified"}
                        </Badge>
                        {eval_.hr_interpretation && (
                          <p className="text-sm text-slate-600">{eval_.hr_interpretation}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <FileText size={28} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No AI Evaluation Yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Go to AI Resume Screening to analyze this applicant's resume.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
