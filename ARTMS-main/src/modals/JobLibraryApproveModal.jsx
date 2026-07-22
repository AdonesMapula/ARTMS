import { CheckCircle, XCircle, FileText } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

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
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Review Job Entry</h2>
            <p className="text-xs text-slate-500">
              Reviewing "{job.job_title}"
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="px-6 py-5"
        style={{ maxHeight: "calc(80vh - 180px)", overflowY: "auto" }}
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
              {(job.salary_min || job.salary_max) && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Salary Range
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    ₱{job.salary_min ? Number(job.salary_min).toLocaleString() : "—"}{" "}
                    - ₱{job.salary_max ? Number(job.salary_max).toLocaleString() : "—"}
                  </p>
                </div>
              )}
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

            {/* Qualifications */}
            {job.qualifications && (
              <div className="mb-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  Qualifications
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {job.qualifications}
                </p>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="border-t border-slate-200 pt-4">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  Responsibilities
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {job.responsibilities}
                </p>
              </div>
            )}
          </div>

          {/* Decision Selection */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Your Decision
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => onStatusChange("approved")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-4 text-sm font-bold capitalize transition ${
                  status === "approved"
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <CheckCircle size={18} />
                Approve
              </button>

              <button
                onClick={() => onStatusChange("rejected")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-4 text-sm font-bold capitalize transition ${
                  status === "rejected"
                    ? "border-red-500 bg-red-500 text-white shadow-lg shadow-red-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Remarks (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Leave a note for the HR team..."
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              This will be visible to the HR team who created this entry.
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-900">
              💡 Review Guidelines
            </p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>• Approved entries will appear in PRF position dropdowns</li>
              <li>• Rejected entries can be revised and resubmitted</li>
              <li>• Your remarks will help the HR team improve the entry</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
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
      </div>
    </Modal>
  );
}
