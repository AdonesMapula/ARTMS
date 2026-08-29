import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Calendar, FileText, ChevronDown, X, Loader, CheckCircle, Download, ExternalLink, Eye, RefreshCw, XCircle, Printer, Sparkles, MessageSquare, Trophy, Flag, Lightbulb } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ResumePreviewModal from "../../modals/ResumePreviewModal";
import applicantService from "../../services/applicantService";
import aiService from "../../services/aiService";
import { useToast } from "../../context/ToastContext";
import ScreeningLoadingModal from "../ui/ScreeningLoadingModal";

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
    setActionLoading(newStatus);
    try {
      await applicantService.updateStatus(applicantId, newStatus);
      toast.success("Status Updated", `Applicant status changed to ${newStatus.replace(/_/g, " ").toUpperCase()}`);
      setShowStatusMenu(false);
      await loadApplicant();
      onUpdated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
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
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
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
    if (!data?.resume_path) {
      toast.error("No Resume File", "Applicant has not uploaded a resume file.");
      return;
    }

    setResumeModalOpen(true);
    setResumeLoading(true);
    try {
      const response = await applicantService.getResume(data.id);
      const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setResumeBlobUrl(objectUrl);
    } catch (err) {
      console.error("Failed to load resume document:", err);
      toast.error("Resume Error", "Could not load the resume file from storage.");
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
  const summary = screening.ai_summary || screening.summary || null;
  const feedback = screening.ai_feedback || screening.feedback || screening.ai_recommendation || null;
  const redFlags = screening.score_breakdown?.red_flags || [];
  const interviewQuestions = screening.score_breakdown?.interview_questions || [];
  const alternativeRoles = screening.score_breakdown?.alternative_roles || [];
  const topAchievements = screening.score_breakdown?.top_achievements || [];
  const isReady = app.status === "ready_for_interview";
  const isHired = app.status === "hired";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300 relative">
      {/* ── AI Screening Loading Modal — blocks all interaction ── */}
      {isScreening && (
        <div className="absolute inset-0 z-50 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <ScreeningLoadingModal applicant={data} inline />
        </div>
      )}
      {/* ── Top Header Banner (Styled like Modal.jsx) ────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#111A62]/10 text-lg font-black text-[#111A62] ring-2 ring-[#111A62]/5 border border-[#111A62]/20">
            {(app.first_name?.[0] || "") + (app.last_name?.[0] || "")}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wide text-slate-700">
                APP-{String(app.id).padStart(3, "0")}
              </span>
              <Badge tone={STATUS_TONE[app.status] || "default"} className="capitalize">
                {app.status ? app.status.replace(/_/g, " ") : "Applied"}
              </Badge>
            </div>
            <h3 className="text-lg font-extrabold text-[#111A62] tracking-tight truncate">
              {app.first_name} {app.last_name}
            </h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed truncate">
              Applied for: <strong className="text-slate-800">{jobTitle}</strong>
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
              className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95 cursor-pointer shadow-sm"
            >
              <X className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
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

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
                  onClick={runScreening}
                  disabled={isScreening}
                >
                  <RefreshCw size={14} className={isScreening ? "animate-spin" : ""} /> {isScreening ? "Re-running..." : "Re-run Screening"}
                </Button>

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
              <Button size="sm" variant="outline" onClick={handleOpenResume} className="gap-1.5 text-xs font-semibold cursor-pointer border-[#111A62]/20 text-[#111A62] hover:bg-[#111A62]/10">
                <Eye size={14} /> Open Resume
              </Button>
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
                <div className="mt-3 rounded-2xl bg-blue-50 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-blue-500">
                    <Sparkles size={13} />
                    AI Summary
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{summary}</p>
                </div>
              )}

              {feedback && (
                <div className="mt-3 rounded-2xl bg-amber-50/60 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-500">
                    <MessageSquare size={13} />
                    Feedback for Applicant
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{feedback}</p>
                </div>
              )}

              {topAchievements.length > 0 && (
                <div className="mt-3 rounded-2xl bg-purple-50 p-4 border border-purple-100">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-600">
                    <Trophy size={13} />
                    Top Achievements
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 font-medium">
                    {topAchievements.map((achievement, idx) => (
                      <li key={idx} className="leading-relaxed">{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {redFlags.length > 0 && (
                <div className="mt-3 rounded-2xl bg-red-50 p-4 border border-red-100">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-red-600">
                    <Flag size={13} />
                    Red Flags & Concerns
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 font-medium">
                    {redFlags.map((flag, idx) => (
                      <li key={idx} className="leading-relaxed">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {interviewQuestions.length > 0 && (
                <div className="mt-3 rounded-2xl bg-indigo-50 p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-600">
                      <Lightbulb size={13} />
                      Recommended Interview Questions
                    </p>
                    <button 
                      onClick={handlePrintQuestions}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-100/50 hover:bg-indigo-200/50 px-2 py-1 rounded-md"
                      title="Print Questions"
                    >
                      <Printer size={12} />
                      <span>Print</span>
                    </button>
                  </div>
                  <ul className="list-decimal pl-5 space-y-2 text-xs text-slate-700 font-medium">
                    {interviewQuestions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {alternativeRoles.length > 0 && (
                <div className="mt-3 rounded-2xl bg-teal-50 p-4 border border-teal-100">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-teal-600">
                    <RefreshCw size={13} />
                    Alternative Role Suggestions
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 font-medium">
                    {alternativeRoles.map((role, idx) => (
                      <li key={idx} className="leading-relaxed">{role}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HR review form */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">HR Decision</p>

                <textarea
                  rows={3}
                  value={hrForm.interpretation}
                  onChange={e => setHrForm(f => ({ ...f, interpretation: e.target.value }))}
                  placeholder="Add your HR interpretation or notes…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#111A62]/20 resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setHrForm(f => ({ ...f, decision: "qualified" }))}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition cursor-pointer ${hrForm.decision === "qualified"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50/50"
                      }`}
                  >
                    <CheckCircle size={13} /> Qualified
                  </button>
                  <button
                    onClick={() => setHrForm(f => ({ ...f, decision: "not_qualified" }))}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition cursor-pointer ${hrForm.decision === "not_qualified"
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-red-50/50"
                      }`}
                  >
                    <XCircle size={13} /> Not Qualified
                  </button>
                </div>

                <button
                  onClick={saveHrReview}
                  disabled={savingHr || !hrForm.decision}
                  className="w-full rounded-xl bg-[#111A62] py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a277a] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
    </div>
  );
}
