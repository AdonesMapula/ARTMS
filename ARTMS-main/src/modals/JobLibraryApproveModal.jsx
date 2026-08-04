import { CheckCircle, XCircle, FileText, RefreshCw } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { calculateSalaryBreakdown } from "../utils/salaryUtils";

/**
 * JobLibraryApproveModal - COO Review (Approve/Revise/Reject) Modal
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
      title={`Review Job Template: ${job.job_title}`}
      description="Review entry details and set the approval status"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={saving}
            className={
              status === "approved"
                ? "bg-emerald-600 hover:bg-emerald-700 font-bold"
                : status === "revised"
                ? "bg-amber-600 hover:bg-amber-700 font-bold"
                : "bg-red-600 hover:bg-red-700 font-bold"
            }
          >
            {saving
              ? "Submitting..."
              : status === "approved"
              ? "Approve Entry"
              : status === "revised"
              ? "Request Revision"
              : "Reject Entry"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Info */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div>
              <span className="text-xs font-semibold text-slate-400">Entry ID</span>
              <p className="text-sm font-extrabold text-[#111A62]">
                JL-{String(job.id).padStart(3, "0")}
              </p>
            </div>
            <Badge
              tone={
                job.approval_status === "approved"
                  ? "success"
                  : job.approval_status === "revised"
                  ? "warning"
                  : "default"
              }
              className="capitalize"
            >
              {job.approval_status === "revised" ? "Needs Revision" : job.approval_status}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold text-slate-400">Category</span>
              <p className="text-sm font-bold text-slate-800">{job.job_category || "—"}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Salary Range</span>
              <p className="text-sm font-bold text-slate-800">
                {job.salary_min || job.salary_max
                  ? `₱${Number(job.salary_min || 0).toLocaleString()} – ₱${Number(job.salary_max || 0).toLocaleString()}`
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Employment Type</span>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {job.employment_type?.replace(/_/g, " ") || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Created By</span>
              <p className="text-sm font-bold text-slate-800">{job.creator?.name || "—"}</p>
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

          {job.job_description && (
            <div>
              <span className="text-xs font-semibold text-slate-400">Description</span>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {job.job_description}
              </p>
            </div>
          )}
        </div>

        {/* Details (Qualifications & Responsibilities) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Qualifications */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h5 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Qualifications
            </h5>
            {Array.isArray(job.qualifications) && job.qualifications.length > 0 ? (
              <div className="space-y-3">
                {job.qualifications.map((qGroup, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      {typeof qGroup === "string" ? qGroup : qGroup.title}
                    </p>
                    {Array.isArray(qGroup.details) && (
                      <ul className="pl-4 space-y-1 text-xs text-slate-600 list-disc">
                        {qGroup.details.map((detail, dIdx) => (
                          <li key={dIdx}>
                            {typeof detail === "object" && detail !== null
                              ? detail.value ?? detail.title ?? ""
                              : String(detail ?? "")}
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
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h5 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Responsibilities
            </h5>
            {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 ? (
              <div className="space-y-3">
                {job.responsibilities.map((rGroup, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      {typeof rGroup === "string" ? rGroup : rGroup.title}
                    </p>
                    {Array.isArray(rGroup.details) && (
                      <ul className="pl-4 space-y-1 text-xs text-slate-600 list-disc">
                        {rGroup.details.map((detail, dIdx) => (
                          <li key={dIdx}>
                            {typeof detail === "object" && detail !== null
                              ? detail.value ?? detail.title ?? ""
                              : String(detail ?? "")}
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
                  <CheckCircle
                    size={18}
                    className={
                      status === "approved" ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                    }
                  />
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
                  <RefreshCw
                    size={18}
                    className={
                      status === "revised" ? "text-amber-600" : "text-slate-400 group-hover:text-amber-500"
                    }
                  />
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
                  <XCircle
                    size={18}
                    className={
                      status === "rejected" ? "text-red-600" : "text-slate-400 group-hover:text-red-500"
                    }
                  />
                  <span>Decline / Reject</span>
                </button>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
                <span>
                  Remarks & Instructions{" "}
                  {status === "revised" && <span className="text-red-500">* (Required for Revision)</span>}
                </span>
                <span className="text-xs font-normal text-slate-400">
                  {status === "revised" ? "Describe required edits" : "(Optional)"}
                </span>
              </label>
              <textarea
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder={
                  status === "revised"
                    ? "Specify what changes or corrections HR needs to make before resubmission..."
                    : "Leave a note for the HR team regarding your decision..."
                }
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
                <p className="text-xs font-bold text-blue-900">Review Guidelines</p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-blue-700">
                  <li>
                    • <span className="font-semibold text-emerald-800">Approved</span> entries will instantly appear in PRF position dropdowns.
                  </li>
                  <li>
                    • <span className="font-semibold text-amber-800">Mark for Revision</span> sends feedback to HR to make edits and resubmit.
                  </li>
                  <li>
                    • <span className="font-semibold text-red-800">Rejected</span> entries will be returned to HR.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
