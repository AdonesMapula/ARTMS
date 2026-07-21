import { FiCheckCircle, FiX } from "react-icons/fi";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800";
const textareaClass =
  "w-full resize-none rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]";

/**
 * JobLibraryApproveModal - COO Review (Approve/Reject) Modal
 * 
 * @param {boolean} open - Modal visibility
 * @param {object} job - Job data to review
 * @param {string} status - "approved" or "rejected"
 * @param {string} remarks - Remarks text
 * @param {function} onStatusChange - Status change callback
 * @param {function} onRemarksChange - Remarks change callback
 * @param {function} onClose - Close callback
 * @param {function} onConfirm - Confirm callback
 * @param {boolean} saving - Loading state
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
  return (
    <Modal
      open={open}
      title="Review Job Entry"
      description={job ? `Reviewing "${job.job_title}"` : ""}
      onClose={onClose}
      className="max-w-2xl" // Larger modal
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <FiX /> Cancel
          </Button>
          <Button
            variant={status === "approved" ? "primary" : "danger"}
            className="flex-1"
            onClick={onConfirm}
            disabled={saving}
          >
            <FiCheckCircle />{" "}
            {saving ? "Saving…" : status === "approved" ? "Approve" : "Reject"}
          </Button>
        </div>
      }
    >
      {job && (
        <div className="space-y-5">
          {/* Job Details Card */}
          <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50 p-5 space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Job Details</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{job.job_title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold text-slate-700">Category:</span>
                <p className="text-slate-600">{job.job_category || "—"}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Type:</span>
                <p className="text-slate-600 capitalize">
                  {job.employment_type?.replace(/_/g, " ") || "—"}
                </p>
              </div>
              {(job.salary_min || job.salary_max) && (
                <div className="col-span-2">
                  <span className="font-semibold text-slate-700">Salary Range:</span>
                  <p className="text-slate-600">
                    ₱{job.salary_min ? Number(job.salary_min).toLocaleString() : "—"} - ₱
                    {job.salary_max ? Number(job.salary_max).toLocaleString() : "—"}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-1">Description:</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {job.job_description || "No description provided."}
              </p>
            </div>

            {job.qualifications && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">Qualifications:</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {job.qualifications}
                </p>
              </div>
            )}

            {job.responsibilities && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">Responsibilities:</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {job.responsibilities}
                </p>
              </div>
            )}
          </div>

          {/* Decision Selection */}
          <div>
            <label className={labelClass}>Decision</label>
            <div className="grid grid-cols-2 gap-3">
              {["approved", "rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold capitalize transition ${
                    status === s
                      ? s === "approved"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        : "border-red-500 bg-red-500 text-white shadow-lg shadow-red-200"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {s === "approved" ? "✓" : "✕"} {s}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className={labelClass}>Remarks (optional)</label>
            <textarea
              rows={3}
              className={textareaClass}
              placeholder="Leave a note for the HR team…"
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              This will be visible to the HR team who created this entry.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
