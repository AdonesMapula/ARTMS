import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, BookOpen, Briefcase, DollarSign, RefreshCw } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { calculateSalaryBreakdown } from "../utils/salaryUtils";

export default function JobLibraryApproveModal({
  open,
  job,
  status,
  remarks,
  onStatusChange,
  onRemarksChange,
  onClose,
  onConfirm,
  saving = false,
}) {
  if (!open || !job) return null;

  const jlId = `JL-${String(job.id).padStart(3, "0")}`;

  const renderArrayEditor = (field, label) => {
    const items = job[field] || [];
    return (
      <div className="flex flex-col h-full pt-2">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
        </div>
        {items && Array.isArray(items) && items.length > 0 ? (
          <div className="space-y-4">
            {items.map((block, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-bold text-slate-800 mb-2">
                  {typeof block === "string" ? block : block.title}
                </h4>
                <ul className="space-y-1.5 list-none pl-0 m-0">
                  {Array.isArray(block.details) && block.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400 pl-1"></span>
                      <span className="text-sm text-slate-600 leading-relaxed">
                        {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No specific {label.toLowerCase()} provided.</p>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-4xl"
      title="Review Job Template"
      description={`Reviewing ${jlId}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={status === "approved" ? "primary" : status === "rejected" ? "danger" : "accent"}
            onClick={onConfirm}
            disabled={!status || saving || (status === "revised" && !remarks?.trim())}
          >
            {saving
              ? "Saving..."
              : status === "approved"
              ? "Approve Entry"
              : status === "rejected"
              ? "Reject Entry"
              : status === "revised"
              ? "Request Revision"
              : "Confirm Action"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Main Details Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="default" className="text-xs font-semibold">
                  {jlId}
                </Badge>
              </div>
              <h3 className="text-lg font-extrabold text-[#111A62]">
                {job.job_title}
              </h3>
            </div>
            <Badge tone="warning" className="capitalize">
              Pending
            </Badge>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <BookOpen size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Category</p>
                <p className="text-sm font-medium text-slate-900">{job.job_category || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <Briefcase size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Employment Type</p>
                <p className="text-sm font-medium text-slate-900 capitalize">
                  {job.employment_type?.replace(/_/g, " ") || "Full Time"}
                </p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <DollarSign size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Target Salary Range</p>
                <p className="text-sm font-extrabold text-emerald-700">
                  {job.salary_min || job.salary_max
                    ? `₱${Number(job.salary_min).toLocaleString()} – ₱${Number(job.salary_max).toLocaleString()}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {(job.description || job.job_description) && (
             <div className="mb-4 rounded-lg bg-white p-4 border border-slate-200 shadow-sm">
               <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
               <p className="text-sm text-slate-700 leading-relaxed">{job.description || job.job_description}</p>
             </div>
          )}

          {(() => {
            const rawRemarks = job.approval_remarks || job.remarks;
            if (rawRemarks && job.approval_status === "pending") {
              const hasHrUpdate = rawRemarks.includes("| [HR Updated]:");
              let cooRemarks = rawRemarks;
              let hrRemarks = null;

              if (hasHrUpdate) {
                const parts = rawRemarks.split("| [HR Updated]:");
                cooRemarks = parts[0].replace("[COO Requested]:", "").trim();
                hrRemarks = parts[1].trim();
              }

              return (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-2">
                    <RefreshCw size={14} className="text-blue-600" />
                    Resubmitted After Revision
                  </p>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-white p-3 border border-blue-100 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Previous COO Instruction</p>
                      <p className="text-sm font-medium text-slate-700 italic">"{cooRemarks}"</p>
                    </div>
                    {hrRemarks && (
                      <div className="rounded-lg bg-blue-600 p-3 shadow-2xs border border-blue-700">
                        <p className="text-[10px] font-bold uppercase text-blue-200 mb-1">HR Revision Notes (What they changed)</p>
                        <p className="text-sm font-medium text-white">{hrRemarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-slate-200">
            {renderArrayEditor("qualifications", "Qualifications")}
            <div className="sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
              {renderArrayEditor("responsibilities", "Responsibilities")}
            </div>
          </div>
        </div>

        {/* COO Decision Panel */}
        <div className="rounded-xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-100 px-5 py-4 border-b border-slate-200">
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <CheckCircle size={18} className="text-blue-500" />
              COO Decision Panel
            </h4>
          </div>
          
          <div className="p-5 space-y-6">
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Select Action
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => onStatusChange("approved")}
                  className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-bold capitalize transition-all overflow-hidden cursor-pointer ${
                    status === "approved"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50"
                  }`}
                >
                  <CheckCircle size={18} className={status === "approved" ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"} />
                  <span>Accept / Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange("revised")}
                  className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-bold capitalize transition-all overflow-hidden cursor-pointer ${
                    status === "revised"
                      ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:bg-amber-50/50"
                  }`}
                >
                  <RefreshCw size={18} className={status === "revised" ? "text-amber-600" : "text-slate-400 group-hover:text-amber-500"} />
                  <span>Mark for Revision</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange("rejected")}
                  className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-bold capitalize transition-all overflow-hidden cursor-pointer ${
                    status === "rejected"
                      ? "border-red-500 bg-red-50 text-red-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-red-400 hover:bg-red-50/50"
                  }`}
                >
                  <XCircle size={18} className={status === "rejected" ? "text-red-600" : "text-slate-400 group-hover:text-red-500"} />
                  <span>Decline / Reject</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
                <span>
                  Remarks & Instructions {status === "revised" && <span className="text-red-500">* (Required for Revision)</span>}
                </span>
                <span className="text-xs font-normal text-slate-400">{status === "revised" ? "Describe required edits" : "(Optional)"}</span>
              </label>
              <textarea
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder={
                  status === "revised"
                    ? "Specify what changes or corrections HR needs to make before resubmission..."
                    : "Leave a note for HR regarding your decision..."
                }
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
              />
            </div>
            
            <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
               <div className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600">
                  <FileText size={14} />
               </div>
               <div>
                  <p className="text-xs font-bold text-blue-900">Review Guidelines</p>
                  <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-blue-700">
                    <li>• <span className="font-semibold text-emerald-800">Approved</span> entries will instantly appear in PRF position dropdowns.</li>
                    <li>• <span className="font-semibold text-amber-800">Mark for Revision</span> sends feedback to HR to make edits and resubmit.</li>
                    <li>• <span className="font-semibold text-red-800">Rejected</span> entries will be returned to HR.</li>
                  </ul>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
