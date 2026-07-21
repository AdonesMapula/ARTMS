import { FiTrash2, FiAlertTriangle } from "react-icons/fi";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

/**
 * JobLibraryDeleteModal - Delete Confirmation Modal
 * 
 * @param {boolean} open - Modal visibility
 * @param {object} job - Job data to delete
 * @param {function} onClose - Close callback
 * @param {function} onConfirm - Confirm delete callback
 */
export default function JobLibraryDeleteModal({ open, job, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      title="Delete Job Entry"
      description="This action cannot be undone."
      onClose={onClose}
      className="max-w-md"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            <FiTrash2 /> Delete
          </Button>
        </div>
      }
    >
      {job && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-red-500" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-red-900">
                Are you sure you want to delete this job entry?
              </p>
              <p className="mt-1 text-red-700">
                <span className="font-semibold">"{job.job_title}"</span> will be permanently
                removed from the library.
              </p>
            </div>
          </div>

          {job.approval_status === "approved" && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Warning: Approved Entry</p>
                <p className="mt-1">
                  This is an approved entry that may be used in PRF position dropdowns. Deleting
                  it could affect existing workflows.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Entry Details
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold text-slate-700">ID:</span>{" "}
                <span className="text-slate-600">JL-{String(job.id).padStart(3, "0")}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Category:</span>{" "}
                <span className="text-slate-600">{job.job_category || "—"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Type:</span>{" "}
                <span className="text-slate-600 capitalize">
                  {job.employment_type?.replace(/_/g, " ") || "—"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Status:</span>{" "}
                <span className="text-slate-600 capitalize">{job.approval_status}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
