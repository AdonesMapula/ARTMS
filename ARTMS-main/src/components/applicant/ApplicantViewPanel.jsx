import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Calendar, FileText, ChevronDown, X, Loader, CheckCircle, Download, ExternalLink, Eye, RefreshCw, XCircle, Printer, Sparkles, MessageSquare, Trophy, Flag, Lightbulb } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ActionLoadingModal from "../ui/ActionLoadingModal";
import ResumePreviewModal from "../../modals/ResumePreviewModal";
import applicantService from "../../services/applicantService";
import aiService from "../../services/aiService";
import { useToast } from "../../context/ToastContext";
import ScreeningLoadingModal from "../ui/ScreeningLoadingModal";

const STAGE_LABELS = {
  applied: "Applied",
  ai_screening: "AI Screening",
  screening_passed: "Screening Passed",
  ready_for_interview: "Ready for Interview",
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  hired: "Hired",
  rejected: "Rejected",
};

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
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  
  const [hrForm, setHrForm] = useState({ interpretation: "", decision: "" });
  const [savingHr, setSavingHr] = useState(false);
  const [hrSaved, setHrSaved] = useState(false);
  const [isScreening, setIsScreening] = useState(false);

  useEffect(() => {
    if (data) {
      const s = data.ai_evaluation || data.aiEvaluation || data.latest_screening || data.screenings?.[0] || {};
      setHrForm({ interpretation: s.hr_interpretation ?? "", decision: s.hr_decision ?? "" });
    }
  }, [data]);

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

  const handlePrintQuestions = () => {
    const screening = data?.ai_evaluation || data?.aiEvaluation || data?.latest_screening || data?.screenings?.[0] || {};
    const interviewQuestions = screening.score_breakdown?.interview_questions || [];
    if (interviewQuestions.length === 0) return;
    
    const printContent = `
      <html>
        <head>
          <title>Interview Questions - ${data.first_name} ${data.last_name}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 8px; }
            h2 { font-size: 14px; color: #64748b; font-weight: normal; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
            ol { padding-left: 20px; }
            li { margin-bottom: 16px; font-size: 15px; line-height: 1.6; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Recommended Interview Questions</h1>
            <h2>Candidate: ${data.first_name} ${data.last_name} | Position: ${data.job_posting?.job_library?.job_title || 'Applied Role'}</h2>
          </div>
          <ol>
            ${interviewQuestions.map(q => `<li>${q}</li>`).join('')}
          </ol>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    printWin.document.open();
    printWin.document.write(printContent);
    printWin.document.close();
    
    setTimeout(() => {
      printWin.print();
    }, 250);
  };

  const handleStatusUpdate = async (newStatus) => {
    const stageName = STAGE_LABELS[newStatus] || newStatus.replace(/_/g, " ");
    setShowStatusMenu(false);
    setActionLoading({
      type: "stage",
      status: newStatus,
      title: "Moving Pipeline Stage",
      message: `Moving candidate to "${stageName}" and updating pipeline records. Please wait...`,
    });
    try {
      await applicantService.updateStatus(applicantId, newStatus);
      toast.success("Status Updated", `Applicant stage changed to ${stageName.toUpperCase()}`);
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReadyForInterview = async () => {
    setActionLoading({
      type: "ready",
      status: "ready_for_interview",
      title: "Advancing to Interview Stage",
      message: "Moving applicant to Ready for Interview and queueing invitation email...",
    });
    try {
      await applicantService.readyForInterview(applicantId, {
        message: `Congratulations! You have been selected for an interview for the ${data?.job_posting?.job_library?.job_title || "position"}.`,
      });
      toast.success("Applicant Notified", "Marked as Ready for Interview and invitation email queued.");
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHire = async () => {
    setActionLoading({
      type: "hire",
      status: "hired",
      title: "Hiring Candidate & Creating 201 File",
      message: "Converting applicant into official 201 employee record. Please wait...",
    });
    try {
      await applicantService.hireApplicant(applicantId, {});
      toast.success("Hired & 201 File Created", "Applicant converted to 201 Employee Record successfully!");
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to hire applicant.");
    } finally {
      setActionLoading(null);
    }
  };

  const runScreening = async () => {
    setIsScreening(true);
    try {
      await aiService.screen(applicantId);
      toast.success("Screening Complete", "AI resume screening has been completed successfully.");
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      const msg = err.response?.data?.message ?? "Screening failed. Check your OpenAI API key.";
      toast.error("Screening Failed", msg);
    } finally {
      setIsScreening(false);
    }
  };

  const saveHrReview = async () => {
    if (!data || !hrForm.decision) return;
    setSavingHr(true);
    try {
      await aiService.hrReview(data.id, {
        hr_interpretation: hrForm.interpretation,
        hr_decision: hrForm.decision,
      });
      setHrSaved(true);
      setTimeout(() => setHrSaved(false), 2500);
      await loadApplicant();
      onUpdated?.();
      const label = hrForm.decision === "qualified" ? "Qualified" : "Not Qualified";
      toast.success("HR Decision Saved", `${data.first_name} ${data.last_name} marked as ${label}.`);
    } catch (err) {
      toast.error("Save Failed", err?.response?.data?.message || "Failed to save HR review.");
    } finally {
      setSavingHr(false);
    }
  };

  const handleOpenResume = async () => {
    setResumeModalOpen(true);
    setResumeLoading(true);
    try {
      const response = await applicantService.getResume(data.id);
      const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setResumeBlobUrl(objectUrl);
    } catch (err) {
      console.warn("Could not load binary resume file, using candidate profile details:", err);
      setResumeBlobUrl(null);
    } finally {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (resumeBlobUrl) {
        URL.revokeObjectURL(resumeBlobUrl);
      }
    };
  }, [resumeBlobUrl]);

  if (!data && !loading) {
    return (
      <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-8 text-center text-slate-400 text-xs font-medium">
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
  const summary = screening.ai_summary || screening.summary || null;
  const feedback = screening.ai_feedback || screening.feedback || screening.ai_recommendation || null;
  const redFlags = screening.score_breakdown?.red_flags || [];
  const interviewQuestions = screening.score_breakdown?.interview_questions || [];
  const alternativeRoles = screening.score_breakdown?.alternative_roles || [];
  const topAchievements = screening.score_breakdown?.top_achievements || [];
  const isReady = app.status === "ready_for_interview";
  const isHired = app.status === "hired";

  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300 relative">
      {/* ── AI Screening Loading Modal — blocks all interaction ── */}
      {isScreening && (
        <div className="absolute inset-0 z-50 rounded-lg overflow-hidden bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs">
          <ScreeningLoadingModal applicant={data} inline />
        </div>
      )}
      {/* ── Top Header Banner ────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-5 py-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-700">
            {(app.first_name?.[0] || "") + (app.last_name?.[0] || "")}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-mono font-bold tracking-tight text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                APP-{String(app.id).padStart(3, "0")}
              </span>
              <Badge tone={STATUS_TONE[app.status] || "default"} className="capitalize">
                {app.status ? app.status.replace(/_/g, " ") : "Applied"}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {app.first_name} {app.last_name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Applied for: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{jobTitle}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
              }}
              aria-label="Close"
              className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer shadow-2xs"
            >
              <X className="h-4 w-4 transition-transform group-hover:scale-105" />
            </button>
          )}
        </div>
      </div>

      {/* ── Panel Body ────────────────────────────────────────────── */}
      <div className="p-5 flex-1 min-h-0 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/40 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader size={28} className="animate-spin text-slate-600 dark:text-slate-300" />
            <p className="text-xs font-medium">Loading Candidate Profile...</p>
          </div>
        ) : (
          <>
            {/* Status Control Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3.5 shadow-2xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Pipeline Status</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 capitalize">
                  Current Stage: <span className="text-slate-900 dark:text-white font-bold">{app.status?.replace(/_/g, " ")}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {app.status === "screening_passed" && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-medium rounded-md"
                    onClick={handleReadyForInterview}
                    disabled={Boolean(actionLoading) || isScreening}
                  >
                    {actionLoading?.type === "ready" ? (
                      <>
                        <Loader size={13} className="animate-spin" /> Moving to Interview...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={13} /> Ready for Interview
                      </>
                    )}
                  </Button>
                )}

                {app.status !== "hired" && app.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="gap-1.5 text-xs font-medium rounded-md"
                    onClick={handleHire}
                    disabled={Boolean(actionLoading) || isScreening}
                  >
                    {actionLoading?.type === "hire" ? (
                      <>
                        <Loader size={13} className="animate-spin" /> Creating 201 File...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={13} /> Hire & Create 201 File
                      </>
                    )}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs text-slate-700 dark:text-slate-300 rounded-md"
                  onClick={runScreening}
                  disabled={Boolean(actionLoading) || isScreening}
                >
                  <RefreshCw size={13} className={isScreening ? "animate-spin" : ""} /> {isScreening ? "Re-running..." : "Re-run Screening"}
                </Button>

                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs text-slate-700 dark:text-slate-300 rounded-md"
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    disabled={Boolean(actionLoading) || isScreening}
                  >
                    {actionLoading?.type === "stage" ? (
                      <>
                        <Loader size={12} className="animate-spin" /> Moving Stage...
                      </>
                    ) : (
                      <>
                        Move Stage <ChevronDown size={12} />
                      </>
                    )}
                  </Button>

                  {showStatusMenu && (
                    <div className="absolute right-0 top-full mt-1 z-30 w-52 rounded-md border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-lg space-y-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {Object.entries(STAGE_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => handleStatusUpdate(key)}
                          disabled={Boolean(actionLoading)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                            app.status === key ? "bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white" : ""
                          }`}
                        >
                          <span>{label}</span>
                          {actionLoading?.status === key && (
                            <Loader size={12} className="animate-spin text-slate-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resume File Card */}
            <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Uploaded Resume Document</p>
                  <p className="text-[11px] text-slate-500 font-mono">{app.resume_path ? app.resume_path.split("/").pop() : "No file attached"}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleOpenResume} className="gap-1.5 text-xs font-medium cursor-pointer rounded-md">
                <Eye size={13} /> Open Resume
              </Button>
            </div>

            {/* Contact Details Grid */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                  <Mail size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{app.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/50">
                  <Phone size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{app.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied Date</p>
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Screening Breakdown */}
            <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Screening Fit Evaluation</h3>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    Match Class: <span className="text-slate-900 dark:text-white capitalize font-black">{fitClass} Fit</span>
                  </p>
                </div>
                {score != null && (
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {score}%
                  </span>
                )}
              </div>

              {/* Parsed Resume Details */}
              {parsedCv && (parsedCv.email || parsedCv.phone || parsedCv.education || parsedCv.experience || parsedCv.skills?.length > 0) && (
                <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-3 space-y-2 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parsed Resume Information</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {parsedCv.email && (
                      <div>
                        <span className="font-medium text-slate-500">Email: </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{parsedCv.email}</span>
                      </div>
                    )}
                    {parsedCv.phone && (
                      <div>
                        <span className="font-medium text-slate-500">Phone: </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{parsedCv.phone}</span>
                      </div>
                    )}
                  </div>
                  {parsedCv.education && (
                    <div>
                      <span className="font-medium text-slate-500">Education: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{parsedCv.education}</span>
                    </div>
                  )}
                  {parsedCv.experience && (
                    <div>
                      <span className="font-medium text-slate-500">Experience: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{parsedCv.experience}</span>
                    </div>
                  )}
                  {parsedCv.skills?.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Extracted Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {parsedCv.skills.map((s) => (
                          <span key={s} className="rounded-[4px] bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
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
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">{f.label}</span>
                        <span className="text-slate-900 dark:text-white font-mono text-[11px] font-bold">{val} / {f.max}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${scoreColor(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                      {remark && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug">{remark}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Skills Matched & Missing */}
              {(skillsMatched.length > 0 || skillsMissing.length > 0) && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requirement Fit</p>
                  {skillsMatched.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skillsMatched.map((s) => (
                        <span key={s} className="rounded-[4px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {skillsMissing.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skillsMissing.map((s) => (
                        <span key={s} className="rounded-[4px] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-400">
                          ✗ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {summary && (
                <div className="mt-3 rounded-md border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-3.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    <Sparkles size={12} />
                    AI Summary
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{summary}</p>
                </div>
              )}

              {feedback && (
                <div className="mt-3 rounded-md border border-amber-200/60 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    <MessageSquare size={12} />
                    Feedback for Applicant
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{feedback}</p>
                </div>
              )}

              {topAchievements.length > 0 && (
                <div className="mt-3 rounded-md border border-purple-200/60 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-3.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    <Trophy size={12} />
                    Top Achievements
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {topAchievements.map((achievement, idx) => (
                      <li key={idx} className="leading-relaxed">{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {redFlags.length > 0 && (
                <div className="mt-3 rounded-md border border-rose-200/60 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-3.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                    <Flag size={12} />
                    Red Flags & Concerns
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {redFlags.map((flag, idx) => (
                      <li key={idx} className="leading-relaxed">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {interviewQuestions.length > 0 && (
                <div className="mt-3 rounded-md border border-indigo-200/60 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      <Lightbulb size={12} />
                      Recommended Interview Questions
                    </p>
                    <button 
                      onClick={handlePrintQuestions}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition bg-indigo-100/60 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md cursor-pointer border border-indigo-200/60 dark:border-indigo-800"
                      title="Print Questions"
                    >
                      <Printer size={11} />
                      <span>Print</span>
                    </button>
                  </div>
                  <ul className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {interviewQuestions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {alternativeRoles.length > 0 && (
                <div className="mt-3 rounded-md border border-teal-200/60 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 p-3.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                    <RefreshCw size={12} />
                    Alternative Role Suggestions
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {alternativeRoles.map((role, idx) => (
                      <li key={idx} className="leading-relaxed">{role}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HR review form */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HR Decision</p>

                <textarea
                  rows={3}
                  value={hrForm.interpretation}
                  onChange={e => setHrForm(f => ({ ...f, interpretation: e.target.value }))}
                  placeholder="Add your HR interpretation or notes…"
                  className="w-full rounded-md border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setHrForm(f => ({ ...f, decision: "qualified" }))}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition cursor-pointer ${hrForm.decision === "qualified"
                        ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <CheckCircle size={13} /> Qualified
                  </button>
                  <button
                    onClick={() => setHrForm(f => ({ ...f, decision: "not_qualified" }))}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition cursor-pointer ${hrForm.decision === "not_qualified"
                        ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <XCircle size={13} /> Not Qualified
                  </button>
                </div>

                <button
                  onClick={saveHrReview}
                  disabled={savingHr || !hrForm.decision}
                  className="w-full rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {savingHr ? "Saving…" : hrSaved ? "✓ Saved!" : "Save HR Review"}
                </button>
              </div>
            </div>

          </>
        )}
      </div>

      {/* In-App Resume PDF / Document Preview Modal */}
      <ResumePreviewModal
        open={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        url={resumeBlobUrl}
        loading={resumeLoading}
        applicant={app}
        applicantName={`${app.first_name || ""} ${app.last_name || ""}`.trim() || "Applicant"}
        fileName={app.resume_original_name || app.resume_path?.split("/").pop() || "Resume.pdf"}
      />

      {/* Full-screen blocking loading overlay for Stage Transitions */}
      <ActionLoadingModal
        open={Boolean(actionLoading)}
        type={actionLoading?.type === "hire" ? "create" : "process"}
        title={actionLoading?.title || "Moving Pipeline Stage"}
        message={actionLoading?.message || "Updating candidate stage and refreshing applicant details. Please wait..."}
      />
    </div>
  );
}
