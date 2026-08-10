import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Building2, User, Calendar, Plus, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const URGENCY_TONE = { low: "default", medium: "info", high: "warning", critical: "danger" };

/**
 * ManpowerApproveModal - COO Review (Approve/Revise/Reject) Modal for PRFs
 */
export default function ManpowerApproveModal({
  open,
  request,
  status,
  remarks,
  onStatusChange,
  onRemarksChange,
  onClose,
  onConfirm,
  onUpdateQualifications,
  onUpdateResponsibilities,
  saving = false,
}) {
  const [form, setForm] = useState({
    qualifications: [],
    responsibilities: [],
  });

  useEffect(() => {
    if (open && request) {
      setForm({
        qualifications: request.qualifications || [],
        responsibilities: request.responsibilities || [],
      });
    }
  }, [open, request]);

  if (!open || !request) return null;

  // Parse employment_status & plantilla_type from request or justification string
  let empStatus = request?.employment_status ?? "";
  let plantType = request?.plantilla_type ?? "";
  let replFor = request?.replacement_for ?? "";

  if (!empStatus && request?.justification) {
    const empMatch = request.justification.match(/Employment Status:\s*([^|]+)/i);
    if (empMatch) empStatus = empMatch[1].trim();
  }
  if (!plantType && request?.justification) {
    const plantMatch = request.justification.match(/Plantilla Type:\s*([^|]+)/i);
    if (plantMatch) plantType = plantMatch[1].trim();
  }
  if (!replFor && request?.justification) {
    const replMatch = request.justification.match(/Replacement For:\s*([^|]+)/i);
    if (replMatch) replFor = replMatch[1].trim();
  }

  // Format strings for display
  const displayEmpStatus = empStatus ? empStatus.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—";
  const displayPlantType = plantType ? plantType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—";

  const renderArrayEditor = (field, label) => {
    const items = request[field] || [];
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
              <div key={block.id || idx}>
                <h4 className="text-sm font-bold text-slate-800 mb-2">{block.title}</h4>
                <ul className="space-y-1.5 list-none pl-0 m-0">
                  {(block.details || []).map((detail, dIdx) => (
                    <li key={detail.id || dIdx} className="flex items-start gap-2">
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
      className="max-w-3xl"
      title="Review Manpower Request"
      description={`Reviewing PRF-${String(request.id).padStart(3, "0")}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={status === "approved" ? "primary" : status === "rejected" ? "danger" : "accent"}
            onClick={() => onConfirm(form)}
            disabled={saving || !status}
          >
            {saving
              ? "Saving..."
              : status === "approved"
              ? "Approve Request"
              : status === "rejected"
              ? "Reject Request"
              : status === "revised"
              ? "Request Revision"
              : "Confirm Action"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* PRF Details Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="default" className="text-xs font-semibold">
                  PRF-{String(request.id).padStart(3, "0")}
                </Badge>
                {request.created_at && (
                  <span className="text-xs text-slate-400">
                    {fmt(request.created_at)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-[#111A62]">
                {request.position_needed}
              </h3>
              {request.jobLibrary?.job_title && (
                <p className="mt-1 text-xs text-slate-500">
                  Based on: {request.jobLibrary.job_title}
                </p>
              )}
            </div>
            <Badge tone={URGENCY_TONE[request.urgency] ?? "default"} className="capitalize">
              {request.urgency} Priority
            </Badge>
          </div>

          {/* Basic Info Grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <Building2 size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Department</p>
                <p className="text-sm font-medium text-slate-900">
                  {request.department?.department_name || request.department?.name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <User size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Requested By</p>
                <p className="text-sm font-medium text-slate-900">
                  {request.requester?.name ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <FileText size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Headcount</p>
                <p className="text-sm font-extrabold text-slate-900">{request.headcount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Needed By</p>
                <p className="text-sm font-medium text-slate-900">{fmt(request.needed_by)}</p>
              </div>
            </div>
          </div>

          {/* Requirement Status Details */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-4 border border-slate-200 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Employment Status
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {displayEmpStatus}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 border border-slate-200 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Plantilla Requirement
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {displayPlantType}
                {replFor && <span className="text-slate-500 font-normal"> (for {replFor})</span>}
              </p>
            </div>
          </div>

          {/* Qualifications & Responsibilities Grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-slate-200">
            {/* Qualifications */}
            {renderArrayEditor("qualifications", "Qualifications")}

            {/* Responsibilities */}
            <div className="sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
              {renderArrayEditor("responsibilities", "Responsibilities")}
            </div>
          </div>
        </div>

        {/* Existing Approval Remarks (if viewing an already processed request) */}
        {(request.approval_remarks || request.remarks) && request.status !== "pending" && (
           <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
             <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
               COO / Executive Review Remarks & Comments
             </p>
             <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">
               "{request.approval_remarks || request.remarks}"
             </p>
           </div>
        )}

        {/* COO Review Action Panel (Only show if request is pending) */}
        {request.status === "pending" && (
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

              {/* Remarks */}
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
                      <li>• <span className="font-semibold text-emerald-800">Approved</span> requests will notify HR to create a Job Posting.</li>
                      <li>• <span className="font-semibold text-amber-800">Mark for Revision</span> sends feedback to HR to make edits and resubmit.</li>
                      <li>• <span className="font-semibold text-red-800">Rejected</span> requests will notify the requesting department.</li>
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
