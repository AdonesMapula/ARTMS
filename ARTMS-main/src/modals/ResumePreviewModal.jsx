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
}) {
  if (!open) return null;

  const isPdf = fileName?.toLowerCase().endsWith(".pdf") || url?.includes("application/pdf") || true;
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(fileName || "");

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
      className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden"
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
      <div className="relative flex-1 w-full h-full min-h-[60vh] bg-slate-900/5 flex items-center justify-center p-2 sm:p-4">
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
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-inner">
            <img src={url} alt="Applicant Resume" className="max-w-full object-contain mx-auto rounded" />
          </div>
        ) : (
          <iframe
            src={url}
            title={`${applicantName} Resume`}
            className="w-full h-full min-h-[65vh] rounded-xl border border-slate-200 bg-white shadow-sm"
          />
        )}
      </div>
    </Modal>
  );
}
