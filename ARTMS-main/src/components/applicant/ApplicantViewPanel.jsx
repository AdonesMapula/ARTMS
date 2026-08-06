import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Calendar, FileText, ChevronDown, X, Loader, CheckCircle, Download, ExternalLink } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import applicantService from "../../services/applicantService";
import { useToast } from "../../context/ToastContext";

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

export default function ApplicantViewPanel({ applicantId, onClose, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (!applicantId) return;
    loadApplicant();
  }, [applicantId]);

  const loadApplicant = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await applicantService.getById(applicantId);
      setData(res.data.applicant || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applicant details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(newStatus);
    try {
      await applicantService.updateStatus(applicantId, newStatus);
      toast.success("Status Updated", `Applicant status changed to ${newStatus.replace(/_/g, " ").toUpperCase()}`);
      setShowStatusMenu(false);
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReadyForInterview = async () => {
    setActionLoading("ready");
    try {
      await applicantService.readyForInterview(applicantId, {
        message: `Congratulations! You have been selected for an interview for the ${data?.job_posting?.job_library?.job_title || "position"}.`,
      });
      toast.success("Applicant Notified", "Marked as Ready for Interview and invitation email queued.");
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHire = async () => {
    setActionLoading("hire");
    try {
      await applicantService.hireApplicant(applicantId, {});
      toast.success("Hired & 201 File Created", "Applicant converted to 201 Employee Record successfully!");
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to hire applicant.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadResume = () => {
    if (!data?.resume_path) {
      toast.error("No Resume File", "Applicant has not uploaded a resume file.");
      return;
    }
    const fullUrl = data.resume_path.startsWith("http")
      ? data.resume_path
      : `${import.meta.env.VITE_STORAGE_URL || "http://127.0.0.1:8000/storage"}/${data.resume_path}`;
    window.open(fullUrl, "_blank");
  };

  if (!data && !loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Applicant record not found.
      </div>
    );
  }

  const app = data || {};
  const jobTitle = app.job_posting?.job_library?.job_title || app.job_posting?.title || "Position Unspecified";
  const screening = app.ai_evaluation || app.aiEvaluation || app.latest_screening || app.screenings?.[0] || {};
  const score = screening.ai_score != null
    ? Math.round(Number(screening.ai_score))
    : (screening.composite_score != null ? Math.round(Number(screening.composite_score)) : null);
  const fitClass = screening.fit_label || app.fit_category || screening.fit_level || "Standard";
  const breakdown = screening.score_breakdown || {};
  const parsedCv = breakdown.parsed_cv || null;
  const skillsMatched = Array.isArray(screening.skills_matched) ? screening.skills_matched : [];
  const skillsMissing = Array.isArray(screening.skills_missing) ? screening.skills_missing : [];
  const summary = screening.ai_summary || screening.summary || screening.ai_feedback || null;
  const isReady = app.status === "ready_for_interview";
  const isHired = app.status === "hired";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="shrink-0 bg-gradient-to-r from-[#111A62] via-[#1a257c] to-[#0d1550] px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-white ring-2 ring-white/20">
              {(app.first_name?.[0] || "") + (app.last_name?.[0] || "")}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white truncate">
                  {app.first_name} {app.last_name}
                </h2>
                <Badge tone={STATUS_TONE[app.status] || "default"} className="px-2.5 py-0.5 text-xs font-bold capitalize">
                  {app.status ? app.status.replace(/_/g, " ") : "Applied"}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Applied for: <strong className="text-white">{jobTitle}</strong></span>
                <span>•</span>
                <span>ID #{app.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                title="Close Applicant Panel"
              >
                <X size={15} />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Panel Body ────────────────────────────────────────────── */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto bg-slate-50/50 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader size={32} className="animate-spin text-[#111A62]" />
            <p className="text-xs font-semibold">Loading Candidate Profile...</p>
          </div>
        ) : (
          <>
            {/* Status Control Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Application Pipeline Status</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 capitalize">
                  Current Stage: <span className="text-[#111A62] font-extrabold">{app.status?.replace(/_/g, " ")}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {app.status === "screening_passed" && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                    onClick={handleReadyForInterview}
                    disabled={actionLoading === "ready"}
                  >
                    <CheckCircle size={14} /> Ready for Interview
                  </Button>
                )}

                {app.status !== "hired" && app.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-[#111A62] text-white gap-1 text-xs"
                    onClick={handleHire}
                    disabled={actionLoading === "hire"}
                  >
                    <CheckCircle size={14} /> Hire & Create 201 File
                  </Button>
                )}

                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs text-slate-700 border-slate-300 bg-white"
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                  >
                    Move Stage <ChevronDown size={13} />
                  </Button>

                  {showStatusMenu && (
                    <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl space-y-0.5 text-xs font-semibold text-slate-700">
                      {["applied", "ai_screening", "screening_passed", "ready_for_interview", "interview_1", "interview_2", "hired", "rejected"].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusUpdate(s)}
                          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 transition capitalize cursor-pointer"
                        >
                          {s.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                  <p className="truncate text-xs font-bold text-slate-900">{app.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Phone size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                  <p className="truncate text-xs font-bold text-slate-900">{app.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Calendar size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Applied Date</p>
                  <p className="truncate text-xs font-bold text-slate-900">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Screening Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">AI Screening Fit Evaluation</h3>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    Match Class: <span className="text-[#111A62] capitalize font-black">{fitClass} Fit</span>
                  </p>
                </div>
                {score != null && (
                  <span className="text-2xl font-black text-[#111A62] bg-[#111A62]/5 px-3.5 py-1 rounded-xl border border-[#111A62]/20">
                    {score}%
                  </span>
                )}
              </div>

              {/* Parsed Resume Details */}
              {parsedCv && (parsedCv.email || parsedCv.phone || parsedCv.education || parsedCv.experience || parsedCv.skills?.length > 0) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Parsed Resume Information</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {parsedCv.email && (
                      <div>
                        <span className="font-bold text-slate-500">Email: </span>
                        <span className="font-semibold text-slate-900">{parsedCv.email}</span>
                      </div>
                    )}
                    {parsedCv.phone && (
                      <div>
                        <span className="font-bold text-slate-500">Phone: </span>
                        <span className="font-semibold text-slate-900">{parsedCv.phone}</span>
                      </div>
                    )}
                  </div>
                  {parsedCv.education && (
                    <div>
                      <span className="font-bold text-slate-500">Education: </span>
                      <span className="font-medium text-slate-800">{parsedCv.education}</span>
                    </div>
                  )}
                  {parsedCv.experience && (
                    <div>
                      <span className="font-bold text-slate-500">Experience: </span>
                      <span className="font-medium text-slate-800">{parsedCv.experience}</span>
                    </div>
                  )}
                  {parsedCv.skills?.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">Extracted Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {parsedCv.skills.map((s) => (
                          <span key={s} className="rounded-full bg-[#111A62]/10 px-2 py-0.5 text-[11px] font-semibold text-[#111A62]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Score Breakdown Bars with Remarks */}
              <div className="grid gap-3 sm:grid-cols-2">
                {BREAKDOWN_FIELDS.map((f) => {
                  const val = breakdown[f.key] ?? breakdown[`${f.key}_score`] ?? 0;
                  const remark = breakdown[`${f.key}_remark`] || null;
                  const pct = Math.min(100, Math.round((val / f.max) * 100));
                  return (
                    <div key={f.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">{f.label}</span>
                        <span className="text-slate-900">{val} / {f.max}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${scoreColor(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                      {remark && (
                        <p className="text-[11px] text-slate-500 font-normal leading-snug">{remark}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Skills Matched & Missing */}
              {(skillsMatched.length > 0 || skillsMissing.length > 0) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Requirement Fit</p>
                  {skillsMatched.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skillsMatched.map((s) => (
                        <span key={s} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {skillsMissing.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skillsMissing.map((s) => (
                        <span key={s} className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
                          ✗ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {summary && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <strong>AI Analysis Summary:</strong> {summary}
                </div>
              )}
            </div>

            {/* Resume File Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Uploaded Resume Document</p>
                  <p className="text-[11px] text-slate-400">{app.resume_path ? app.resume_path.split("/").pop() : "No file attached"}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleDownloadResume} className="gap-1.5 text-xs">
                <Download size={14} /> Open Resume
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
