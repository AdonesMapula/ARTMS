import React from "react";
import { FileText, Download, ExternalLink, Printer, X, Loader2, AlertCircle } from "lucide-react";
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

  const handlePrint = () => {
    if (!url) return;
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
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
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!url || loading}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
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
                  <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-blue-600">AI Summary</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{summary}</p>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-100/50">
                  <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Feedback for Applicant</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{feedback}</p>
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
            <div className="flex flex-col items-center gap-2 text-slate-500 py-16 text-center">
              <AlertCircle size={36} className="text-amber-500" />
              <p className="text-sm font-bold text-slate-700">Resume File Not Available</p>
              <p className="text-xs text-slate-400">The applicant has not uploaded a readable resume file.</p>
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
