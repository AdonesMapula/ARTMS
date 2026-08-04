import { CheckCircle, XCircle, FileText } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { calculateSalaryBreakdown } from "../utils/salaryUtils";

/**
 * JobLibraryApproveModal - COO Review (Approve/Reject) Modal
 */
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-3xl"
      title="Review Job Entry"
      description={`Reviewing "${job.job_title}"`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={status === "approved" ? "primary" : "danger"}
            onClick={onConfirm}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : status === "approved"
              ? "Approve Entry"
              : "Reject Entry"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
          {/* Job Details Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {job.job_title}
                </h3>
                <span className="text-xs text-slate-400">
                  JL-{String(job.id).padStart(3, "0")}
                </span>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-500">Category</p>
                <p className="text-sm font-medium text-slate-900">
                  {job.job_category || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Employment Type
                </p>
                <Badge tone="accent" className="mt-1">
                  {job.employment_type?.replace(/_/g, " ") || "—"}
                </Badge>
              </div>
              {(() => {
                const bd = calculateSalaryBreakdown(job.salary_min, job.salary_max, job.salary_type);
                if (!bd) return null;
                return (
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Compensation & Rate Breakdown
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <p className="text-[11px] font-semibold text-slate-500">Monthly Salary</p>
                        <p className="text-sm font-extrabold text-[#111A62] mt-0.5">{bd.formatted.monthly}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <p className="text-[11px] font-semibold text-slate-500">Weekly Rate</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{bd.formatted.weekly}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <p className="text-[11px] font-semibold text-slate-500">Daily Rate</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{bd.formatted.daily}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <p className="text-[11px] font-semibold text-slate-500">Hourly Rate</p>
                        <p className="text-sm font-bold text-[#111A62] mt-0.5">{bd.formatted.hourly}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Description */}
            {job.job_description && (
              <div className="mb-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  Description
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  {job.job_description}
                </p>
              </div>
            )}

            {/* Qualifications & Responsibilities Grid */}
            <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-slate-200">
              {/* Qualifications */}
              <div className="flex flex-col h-full pt-2">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Qualifications
                </p>
                {job.qualifications && Array.isArray(job.qualifications) && job.qualifications.length > 0 ? (
                  <div className="space-y-3">
                    {job.qualifications.map((block, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800">{block.title}</h4>
                        {block.details && block.details.length > 0 && (
                          <ul className="mt-2 space-y-1 pl-4 list-disc marker:text-slate-300">
                            {block.details.map((detail, dIdx) => (
                              <li key={dIdx} className="text-sm text-slate-600 pl-1 leading-relaxed">
                                {detail.value}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No qualifications added.</p>
                )}
              </div>

              {/* Responsibilities */}
              <div className="flex flex-col h-full pt-2 sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Responsibilities
                </p>
                {job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0 ? (
                  <div className="space-y-3">
                    {job.responsibilities.map((block, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800">{block.title}</h4>
                        {block.details && block.details.length > 0 && (
                          <ul className="mt-2 space-y-1 pl-4 list-disc marker:text-slate-300">
                            {block.details.map((detail, dIdx) => (
                              <li key={dIdx} className="text-sm text-slate-600 pl-1 leading-relaxed">
                                {detail.value}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No responsibilities added.</p>
                )}
              </div>
            </div>
          </div>

          {/* COO Review Action Panel */}
          <div className="rounded-xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-100 px-5 py-4 border-b border-slate-200">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-500" />
                COO Decision Panel
              </h4>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Decision Selection */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Select Action
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => onStatusChange("approved")}
                    className={`group relative flex items-center justify-center gap-3 rounded-xl border-2 px-6 py-4 text-sm font-bold capitalize transition-all overflow-hidden ${
                      status === "approved"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    {status === "approved" && (
                      <div className="absolute inset-0 bg-emerald-500 opacity-5"></div>
                    )}
                    <CheckCircle size={20} className={status === "approved" ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500 transition-colors"} />
                    <span className="z-10">Approve Entry</span>
                  </button>

                  <button
                    onClick={() => onStatusChange("rejected")}
                    className={`group relative flex items-center justify-center gap-3 rounded-xl border-2 px-6 py-4 text-sm font-bold capitalize transition-all overflow-hidden ${
                      status === "rejected"
                        ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-red-400 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    {status === "rejected" && (
                      <div className="absolute inset-0 bg-red-500 opacity-5"></div>
                    )}
                    <XCircle size={20} className={status === "rejected" ? "text-red-600" : "text-slate-400 group-hover:text-red-500 transition-colors"} />
                    <span className="z-10">Reject Entry</span>
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
                  Remarks
                  <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Leave a note for the HR team regarding your decision..."
                  value={remarks}
                  onChange={(e) => onRemarksChange(e.target.value)}
                />
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                 <div className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600">
                    <FileText size={14} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-blue-900">
                      Review Guidelines
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-blue-700">
                      <li>• <span className="font-medium text-blue-800">Approved</span> entries will instantly appear in PRF position dropdowns.</li>
                      <li>• <span className="font-medium text-blue-800">Rejected</span> entries will be returned to HR for revisions.</li>
                    </ul>
                 </div>
              </div>
            </div>
          </div>
        </div>
    </Modal>
  );
}
