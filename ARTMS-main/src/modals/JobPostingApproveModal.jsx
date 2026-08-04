import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Briefcase, Building2, MapPin, Calendar, User, Plus, Trash2 } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };
const STATUS_TONE   = { published: "success", pending_approval: "warning", cancelled: "danger", closed: "default" };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—");

/**
 * JobPostingApproveModal — COO Review (Approve/Reject) Modal for Job Postings
 * Mirrors the design and structure of ManpowerApproveModal.
 */
export default function JobPostingApproveModal({
  open,
  posting,
  status,
  remarks,
  onStatusChange,
  onRemarksChange,
  onClose,
  onConfirm,
  saving = false,
}) {
  if (!open || !posting) return null;

  const [form, setForm] = useState({
    qualifications: [],
    responsibilities: [],
  });

  useEffect(() => {
    if (open && posting) {
      setForm({
        qualifications: posting.qualifications || posting.job_library?.qualifications || [],
        responsibilities: posting.responsibilities || posting.job_library?.responsibilities || [],
      });
    }
  }, [open, posting]);

  // ── Array editor helpers ────────────────────────────────────────────────
  const handleAddBlock = (field) => {
    setForm((prev) => ({
      ...prev,
      [field]: [
        ...(prev[field] || []),
        { id: crypto.randomUUID(), title: "", details: [] },
      ],
    }));
  };

  const handleRemoveBlock = (field, idx) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateBlockTitle = (field, idx, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b, i) =>
        i === idx ? { ...b, title: value } : b
      ),
    }));
  };

  const handleAddDetail = (field, blockIdx) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b, i) =>
        i === blockIdx
          ? {
              ...b,
              details: [
                ...(b.details || []),
                { id: crypto.randomUUID(), value: "" },
              ],
            }
          : b
      ),
    }));
  };

  const handleRemoveDetail = (field, blockIdx, detailIdx) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b, i) =>
        i === blockIdx
          ? {
              ...b,
              details: b.details.filter((_, j) => j !== detailIdx),
            }
          : b
      ),
    }));
  };

  const handleUpdateDetailValue = (field, blockIdx, detailIdx, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b, i) =>
        i === blockIdx
          ? {
              ...b,
              details: b.details.map((d, j) =>
                j === detailIdx ? { ...d, value } : d
              ),
            }
          : b
      ),
    }));
  };

  const renderArrayEditor = (field, label) => {
    const isPending = posting.approval_status === "pending";

    return (
      <div className="flex flex-col h-full pt-2">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          {isPending && (
            <button
              type="button"
              onClick={() => handleAddBlock(field)}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300 cursor-pointer"
            >
              <Plus size={12} /> Add Group
            </button>
          )}
        </div>

        {form[field] && Array.isArray(form[field]) && form[field].length > 0 ? (
          <div className="space-y-3">
            {form[field].map((block, idx) => (
              <div key={block.id || idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-blue-200">
                <div className="mb-2 flex items-center justify-between gap-3">
                  {isPending ? (
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => handleUpdateBlockTitle(field, idx, e.target.value)}
                      placeholder="Group Title..."
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  ) : (
                    <h4 className="text-sm font-bold text-slate-800">{block.title}</h4>
                  )}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(field, idx)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 mt-2">
                  {(block.details || []).map((detail, dIdx) => (
                    <div key={detail.id || dIdx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400 pl-1"></span>
                      {isPending ? (
                        <textarea
                          rows={1}
                          value={detail.value}
                          onChange={(e) => handleUpdateDetailValue(field, idx, dIdx, e.target.value)}
                          placeholder="Add detail..."
                          className="w-full resize-none rounded-md border border-transparent bg-slate-50 px-2 py-1 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                        />
                      ) : (
                        <span className="text-sm text-slate-600 leading-relaxed">
                          {detail.value}
                        </span>
                      )}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDetail(field, idx, dIdx)}
                          className="mt-0.5 shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleAddDetail(field, idx)}
                      className="ml-3 mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Plus size={12} /> Add Detail
                    </button>
                  )}
                </div>
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
      className="max-w-3xl"
      title="Review Job Posting"
      description={`Reviewing JP-${String(posting.id).padStart(3, "0")}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={status === "approved" ? "primary" : "danger"}
            onClick={() => onConfirm(form)}
            disabled={saving || !status}
          >
            {saving
              ? "Saving..."
              : status === "approved"
              ? "Approve & Publish"
              : status === "rejected"
              ? "Reject Posting"
              : "Confirm Action"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Posting Details Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="default" className="text-xs font-semibold">
                  JP-{String(posting.id).padStart(3, "0")}
                </Badge>
                {posting.created_at && (
                  <span className="text-xs text-slate-400">
                    {fmt(posting.created_at)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-[#111A62]">
                {posting.job_library?.job_title || "Untitled Position"}
              </h3>
              {posting.is_modified_from_prf && (
                <Badge tone="warning" className="mt-1 text-[10px] uppercase tracking-wider">
                  Modified by HR
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone={APPROVAL_TONE[posting.approval_status] ?? "default"} className="capitalize">
                {posting.approval_status}
              </Badge>
              <Badge tone={STATUS_TONE[posting.status] ?? "default"} className="capitalize text-xs">
                {cap(posting.status)}
              </Badge>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <Building2 size={16} className="text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500">Department</p>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {posting.department?.name || posting.department?.department_name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <MapPin size={16} className="text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500">Location</p>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {posting.location || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <User size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Vacancies</p>
                <p className="text-sm font-extrabold text-slate-900">{posting.vacancies_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Deadline</p>
                <p className="text-sm font-medium text-slate-900">{fmt(posting.closing_date)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {posting.description && (
            <div className="mb-4 rounded-lg bg-white p-4 border border-slate-200 shadow-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Job Description
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                {posting.description}
              </p>
            </div>
          )}

          {/* Qualifications & Responsibilities Grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-slate-200">
            {renderArrayEditor("qualifications", "Qualifications")}
            <div className="sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
              {renderArrayEditor("responsibilities", "Responsibilities")}
            </div>
          </div>
        </div>

        {/* Existing Approval Remarks (for already-processed postings) */}
        {(posting.approval_remarks || posting.remarks) && posting.approval_status !== "pending" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              COO / Executive Review Remarks & Comments
            </p>
            <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">
              "{posting.approval_remarks || posting.remarks}"
            </p>
          </div>
        )}

        {/* COO Review Action Panel (Only show if posting is pending) */}
        {posting.approval_status === "pending" && (
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
                    <span className="z-10">Approve & Publish</span>
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
                    <span className="z-10">Reject Posting</span>
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
                  placeholder="Leave a note for HR regarding your decision..."
                  value={remarks}
                  onChange={(e) => onRemarksChange(e.target.value)}
                />
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                <div className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600">
                  <Briefcase size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900">
                    Review Guidelines
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-blue-700">
                    <li>• <span className="font-medium text-blue-800">Approved</span> postings will go live immediately on the public Jobs page for applicants.</li>
                    <li>• <span className="font-medium text-blue-800">Rejected</span> postings will notify HR to revise and resubmit.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
