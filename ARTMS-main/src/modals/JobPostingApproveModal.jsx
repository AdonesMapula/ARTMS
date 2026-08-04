import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Briefcase, Building2, MapPin, Calendar, User, Plus, Trash2, RefreshCw } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const APPROVAL_TONE = { approved: "success", pending: "warning", revised: "warning", rejected: "danger" };
const STATUS_TONE   = { published: "success", pending_approval: "warning", cancelled: "danger", closed: "default" };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—");

/**
 * JobPostingApproveModal — COO Review (Approve/Revise/Reject) Modal for Job Postings
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
  const [form, setForm] = useState({ qualifications: [], responsibilities: [] });

  useEffect(() => {
    if (posting) {
      const normalizeBlocks = (blocks) => {
        if (!Array.isArray(blocks)) return [];
        return blocks.map((b, i) => ({
          id: b.id || Date.now() + i,
          title: typeof b === "string" ? b : (b.title || ""),
          details: Array.isArray(b.details)
            ? b.details.map((d, j) => ({
                id: typeof d === "object" && d !== null && d.id ? d.id : Date.now() + i * 100 + j,
                value: typeof d === "object" && d !== null ? (d.value ?? d.title ?? "") : String(d ?? ""),
              }))
            : typeof b.details === "string" && b.details
            ? [{ id: Date.now() + i * 100, value: b.details }]
            : [],
        }));
      };

      setForm({
        qualifications: normalizeBlocks(posting.qualifications),
        responsibilities: normalizeBlocks(posting.responsibilities),
      });
    }
  }, [posting]);

  if (!open || !posting) return null;

  const isPending = posting.approval_status === "pending";

  const handleTitleChange = (field, index, value) => {
    setForm((prev) => {
      const updated = [...prev[field]];
      updated[index] = { ...updated[index], title: value };
      return { ...prev, [field]: updated };
    });
  };

  const handleDetailChange = (field, groupIdx, detailIdx, value) => {
    setForm((prev) => {
      const updated = [...prev[field]];
      const details = [...updated[groupIdx].details];
      details[detailIdx] = typeof details[detailIdx] === "object" ? { ...details[detailIdx], value } : value;
      updated[groupIdx] = { ...updated[groupIdx], details };
      return { ...prev, [field]: updated };
    });
  };

  const handleAddDetail = (field, groupIdx) => {
    setForm((prev) => {
      const updated = [...prev[field]];
      const details = [...(updated[groupIdx].details || []), { id: Date.now(), value: "" }];
      updated[groupIdx] = { ...updated[groupIdx], details };
      return { ...prev, [field]: updated };
    });
  };

  const handleRemoveDetail = (field, groupIdx, detailIdx) => {
    setForm((prev) => {
      const updated = [...prev[field]];
      const details = updated[groupIdx].details.filter((_, i) => i !== detailIdx);
      updated[groupIdx] = { ...updated[groupIdx], details };
      return { ...prev, [field]: updated };
    });
  };

  const handleAddGroup = (field) => {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], { id: Date.now(), title: "New Group", details: [{ id: Date.now() + 1, value: "" }] }],
    }));
  };

  const handleRemoveGroup = (field, groupIdx) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== groupIdx),
    }));
  };

  const renderSection = (title, field, label) => {
    const groups = form[field] || [];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
            {title}
          </h4>
          {isPending && (
            <button
              type="button"
              onClick={() => handleAddGroup(field)}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Plus size={14} /> Add Category Group
            </button>
          )}
        </div>

        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group, idx) => (
              <div key={group.id || idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  {isPending ? (
                    <input
                      type="text"
                      className="font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500 flex-1"
                      value={group.title}
                      onChange={(e) => handleTitleChange(field, idx, e.target.value)}
                      placeholder="Category Title"
                    />
                  ) : (
                    <h5 className="font-bold text-sm text-slate-800">{group.title}</h5>
                  )}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(field, idx)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 pl-2">
                  {group.details?.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2">
                      <span className="mt-1 text-xs text-slate-400">•</span>
                      {isPending ? (
                        <input
                          type="text"
                          className="flex-1 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                          value={typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                          onChange={(e) => handleDetailChange(field, idx, dIdx, e.target.value)}
                          placeholder="Requirement detail..."
                        />
                      ) : (
                        <span className="text-sm text-slate-600 leading-relaxed">
                          {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                        </span>
                      )}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDetail(field, idx, dIdx)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
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
                      className="ml-4 text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      + Add Detail
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No {label.toLowerCase()} provided.</p>
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
            variant="primary"
            onClick={() => onConfirm(form)}
            disabled={saving || !status}
            className={
              status === "approved"
                ? "bg-emerald-600 hover:bg-emerald-700 font-bold"
                : status === "revised"
                ? "bg-amber-600 hover:bg-amber-700 font-bold"
                : "bg-red-600 hover:bg-red-700 font-bold"
            }
          >
            {saving
              ? "Saving..."
              : status === "approved"
              ? "Approve & Publish"
              : status === "revised"
              ? "Request Revision"
              : "Reject Posting"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="default" className="text-[10px]">JP-{String(posting.id).padStart(3, "0")}</Badge>
                {posting.created_at && <span className="text-xs text-slate-400">{fmt(posting.created_at)}</span>}
              </div>
              <h3 className="text-lg font-extrabold text-[#111A62]">
                {posting.job_library?.job_title || "Untitled Position"}
              </h3>
            </div>
            <Badge tone={APPROVAL_TONE[posting.approval_status] ?? "default"} className="capitalize">
              {posting.approval_status === "revised" ? "Needs Revision" : posting.approval_status}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-3 border border-slate-200/60">
              <span className="text-xs text-slate-400 block mb-0.5">Department</span>
              <span className="text-sm font-semibold text-slate-800">
                {posting.department?.name || posting.department?.department_name || "—"}
              </span>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200/60">
              <span className="text-xs text-slate-400 block mb-0.5">Location</span>
              <span className="text-sm font-semibold text-slate-800">{posting.location || "—"}</span>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200/60">
              <span className="text-xs text-slate-400 block mb-0.5">Vacancies</span>
              <span className="text-sm font-extrabold text-slate-800">{posting.vacancies_count}</span>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200/60">
              <span className="text-xs text-slate-400 block mb-0.5">Closing Date</span>
              <span className="text-sm font-semibold text-slate-800">{fmt(posting.closing_date)}</span>
            </div>
          </div>
        </div>

        {renderSection("Qualifications & Requirements", "qualifications", "Qualifications")}
        {renderSection("Key Responsibilities", "responsibilities", "Responsibilities")}

        {(posting.approval_remarks || posting.remarks) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs font-bold text-amber-900 mb-1">
              COO / Executive Review Remarks & Comments
            </p>
            <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">
              "{posting.approval_remarks || posting.remarks}"
            </p>
          </div>
        )}

        {isPending && (
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
                    <span>Approve & Publish</span>
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
                  <Briefcase size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900">
                    Review Guidelines
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-blue-700">
                    <li>• <span className="font-semibold text-emerald-800">Approved</span> postings will publish live to the public portal immediately.</li>
                    <li>• <span className="font-semibold text-amber-800">Mark for Revision</span> sends feedback to HR to make edits and resubmit.</li>
                    <li>• <span className="font-semibold text-red-800">Rejected</span> postings will be cancelled and archived.</li>
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
