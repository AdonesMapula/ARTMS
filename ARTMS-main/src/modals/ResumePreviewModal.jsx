import React from "react";
import { FileText, Download, ExternalLink, Printer, X, Loader2, AlertCircle, Sparkles, MessageSquare, Trophy, Flag, Lightbulb, RefreshCw } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

/**
 * ResumePreviewModal
 *
 * Full featured, in-app modal to preview and download applicant resumes (PDF, Images, Docs).
 */
export default function ResumePreviewModal({
  open,
  onClose,
  url,
  applicantName = "Applicant",
  fileName = "Resume.pdf",
  loading = false,
  applicant,
}) {
  if (!open) return null;

  const isPdf = fileName?.toLowerCase().endsWith(".pdf") || url?.includes("application/pdf") || true;
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(fileName || "");

  const screening = applicant?.ai_evaluation || applicant?.aiEvaluation || applicant?.latest_screening || applicant?.screenings?.[0] || {};
  const score = screening.ai_score != null
    ? Math.round(Number(screening.ai_score))
    : (screening.composite_score != null ? Math.round(Number(screening.composite_score)) : null);
  const fitClass = screening.fit_label || applicant?.fit_category || screening.fit_level;
  const summary = screening.ai_summary || screening.summary || null;
  const feedback = screening.ai_feedback || screening.feedback || screening.ai_recommendation || null;
  const breakdown = screening.score_breakdown || {};
  const redFlags = breakdown.red_flags || [];
  const interviewQuestions = breakdown.interview_questions || [];
  const alternativeRoles = breakdown.alternative_roles || [];
  const topAchievements = breakdown.top_achievements || [];
  
  const BREAKDOWN_FIELDS = [
    { key: "education", label: "Education", max: 25 },
    { key: "experience", label: "Experience", max: 35 },
    { key: "skills", label: "Skills", max: 30 },
    { key: "other", label: "Other / License", max: 10 },
  ];

  const scoreColor = (pct) => {
    if (pct >= 75) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-400";
    return "bg-red-400";
  };

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "Resume.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleOpenNewTab = () => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const handlePrintResume = () => {
    if (!url) return;
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  };

  const handlePrintQuestions = () => {
    if (interviewQuestions.length === 0) return;
    
    const printContent = `
      <html>
        <head>
          <title>Interview Questions - ${applicantName}</title>
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
            <h2>Candidate: ${applicantName} | Position: ${applicant?.position || 'Applied Role'}</h2>
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-[90vw] h-[95vh] flex flex-col p-0 overflow-hidden"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              {applicantName}&apos;s Resume
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {fileName || "resume_document.pdf"}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            Viewing uploaded applicant document
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenNewTab}
              disabled={!url || loading}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintQuestions}
              disabled={interviewQuestions.length === 0}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print Questions</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintResume}
              disabled={!url || loading}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print Resume</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={!url || loading}
              className="gap-1.5 text-xs bg-[#111A62] text-white hover:bg-[#0d1449] cursor-pointer"
            >
              <Download size={13} />
              <span>Download</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row flex-1 h-full min-h-[60vh] overflow-hidden bg-slate-50">
        
        {/* Left Side: AI Information */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white overflow-y-auto p-5">
          <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#111A62] text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            AI Resume Analysis
          </h4>

          {score == null ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              <p className="text-xs font-semibold">No AI screening data available for this resume yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Score & Fit */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Overall Fit</p>
                  <p className="text-sm font-black text-[#111A62] capitalize">{fitClass || "Standard"} Match</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Score</p>
                  <span className="text-lg font-black text-[#111A62] bg-white px-3 rounded-lg border border-slate-200 shadow-sm">{score}%</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Score Breakdown</p>
                <div className="grid gap-2.5">
                  {BREAKDOWN_FIELDS.map((f) => {
                    const val = breakdown[f.key] ?? breakdown[`${f.key}_score`] ?? 0;
                    const pct = Math.min(100, Math.round((val / f.max) * 100));
                    return (
                      <div key={f.key} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-600">{f.label}</span>
                          <span className="text-slate-900">{val} / {f.max}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${scoreColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-100/50">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                    <Sparkles size={12} />
                    AI Summary
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{summary}</p>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-100/50">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-600">
                    <MessageSquare size={12} />
                    Feedback for Applicant
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{feedback}</p>
                </div>
              )}

              {/* Top Achievements */}
              {topAchievements.length > 0 && (
                <div className="rounded-xl bg-purple-50 p-3.5 border border-purple-100/50">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-purple-600">
                    <Trophy size={12} />
                    Top Achievements
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 font-medium">
                    {topAchievements.map((achievement, idx) => (
                      <li key={idx} className="leading-relaxed">{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {redFlags.length > 0 && (
                <div className="rounded-xl bg-red-50 p-3.5 border border-red-100/50">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-red-600">
                    <Flag size={12} />
                    Red Flags & Concerns
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 font-medium">
                    {redFlags.map((flag, idx) => (
                      <li key={idx} className="leading-relaxed">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interview Questions */}
              {interviewQuestions.length > 0 && (
                <div className="rounded-xl bg-indigo-50 p-3.5 border border-indigo-100/50">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                    <Lightbulb size={12} />
                    Recommended Interview Questions
                  </p>
                  <ul className="list-decimal pl-4 space-y-2 text-xs text-slate-700 font-medium">
                    {interviewQuestions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alternative Roles */}
              {alternativeRoles.length > 0 && (
                <div className="rounded-xl bg-teal-50 p-3.5 border border-teal-100/50">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-teal-600">
                    <RefreshCw size={12} />
                    Alternative Role Suggestions
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 font-medium">
                    {alternativeRoles.map((role, idx) => (
                      <li key={idx} className="leading-relaxed">{role}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Right Side: Resume Viewer */}
        <div className="flex-1 relative w-full h-full bg-slate-900/5 flex items-center justify-center p-2 sm:p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500 py-16">
              <Loader2 size={32} className="animate-spin text-[#111A62]" />
              <p className="text-sm font-semibold">Loading Resume Document...</p>
            </div>
          ) : !url ? (
            <div className="h-full w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 pb-5 mb-5 flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 mb-2 border border-blue-100">
                      Digital Candidate Profile
                    </span>
                    <h3 className="text-xl font-black text-slate-900">{applicantName}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Applied for <span className="text-[#111A62] font-bold">{applicant?.job_posting?.job_library?.job_title || applicant?.position || "Target Position"}</span>
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111A62]/10 text-base font-black text-[#111A62]">
                    {applicantName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Email Address</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{applicant?.email || "Not Provided"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Phone Number</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{applicant?.phone || "Not Provided"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Experience</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {applicant?.years_of_experience ? `${applicant.years_of_experience} Years` : "Screened via AI"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Highest Education</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {applicant?.highest_education || "Degree / College Level"}
                    </p>
                  </div>
                </div>

                {summary && (
                  <div className="space-y-1.5 mb-5">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Professional Summary</p>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {summary}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Application ID: {applicant?.application_id || `APP-${applicant?.id || "N/A"}`}</span>
                <span>ARTMS Talent Management</span>
              </div>
            </div>
          ) : isImage ? (
            <div className="h-full w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-inner">
              <img src={url} alt="Applicant Resume" className="max-w-full object-contain mx-auto rounded" />
            </div>
          ) : (
            <iframe
              src={url}
              title={`${applicantName} Resume`}
              className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-sm"
            />
          )}
        </div>

      </div>
    </Modal>
  );
}
