import { Trash2, AlertTriangle } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

/**
 * JobLibraryDeleteModal - Delete Confirmation Modal
 */
export default function JobLibraryDeleteModal({ open, job, onClose, onConfirm }) {
  if (!open || !job) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Delete Job Entry?
            </h2>
            <p className="text-xs text-slate-500">This action cannot be undone</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <div className="space-y-4">
          {/* Warning Box */}
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">
                Are you sure you want to delete this job entry?
              </p>
              <p className="mt-1 text-red-700">
                <span className="font-semibold">"{job.job_title}"</span> will be
                permanently removed from the library.
              </p>
            </div>
          </div>

          {/* Approved Entry Warning */}
          {job.approval_status === "approved" && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Warning: Approved Entry</p>
                <p className="mt-1">
                  This is an approved entry that may be used in PRF position
                  dropdowns. Deleting it could affect existing workflows.
                </p>
              </div>
            </div>
          )}

          {/* Entry Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Entry Details
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Job ID:</span>
                <span className="text-sm text-slate-600">
                  JL-{String(job.id).padStart(3, "0")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Title:</span>
                <span className="text-sm text-slate-900 font-medium">
                  {job.job_title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Category:</span>
                <span className="text-sm text-slate-600">
                  {job.job_category || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Type:</span>
                <Badge tone="accent" className="text-xs">
                  {job.employment_type?.replace(/_/g, " ") || "—"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Status:</span>
                <Badge
                  tone={
                    job.approval_status === "approved"
                      ? "success"
                      : job.approval_status === "pending"
                      ? "warning"
                      : "danger"
                  }
                  className="text-xs capitalize"
                >
                  {job.approval_status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-700">
              ℹ️ What happens after deletion?
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• The job entry will be permanently removed</li>
              <li>• It will no longer appear in PRF dropdowns</li>
              <li>• Existing PRFs using this entry won't be affected</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} className="gap-1.5">
            <Trash2 size={14} />
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}
