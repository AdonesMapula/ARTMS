import { FileText, Building2, User, Calendar, Clock, CheckCircle2, AlertCircle, Briefcase, Target, ShieldCheck } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const URGENCY_TONE = { low: "default", medium: "info", high: "warning", critical: "danger" };
const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" };

/**
 * ManpowerViewModal - Displays full details of a Manpower Request (PRF)
 */
export default function ManpowerViewModal({ open, request, onClose }) {
  if (!open || !request) return null;

  const prfId = `PRF-${String(request.id).padStart(3, "0")}`;
  const position = request.position_needed || request.jobLibrary?.job_title || "Unspecified Position";
  const departmentName = request.department?.name || request.department_name || "—";
  const requesterName = request.requester?.name || request.requested_by || "—";
  const employmentType = request.employment_type ? request.employment_type.replace('_', ' ').toUpperCase() : "FULL TIME";

  // Qualifications and Responsibilities fallback formatting
  const qualifications = Array.isArray(request.qualifications)
    ? request.qualifications
    : typeof request.qualifications === "string" && request.qualifications
    ? [{ id: "1", title: "General Qualifications", details: [request.qualifications] }]
    : [];

  const responsibilities = Array.isArray(request.responsibilities)
    ? request.responsibilities
    : typeof request.responsibilities === "string" && request.responsibilities
    ? [{ id: "1", title: "Core Responsibilities", details: [request.responsibilities] }]
    : [];

  return (
    <Modal
      open={open}
      title={`Manpower Request Details — ${prfId}`}
      description="View full position specification, justification, and approval history."
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-slate-800">
        {/* Header Summary Banner */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--artms-accent)]">
                  {prfId}
                </span>
                <Badge tone={STATUS_TONE[request.status] ?? "default"} className="capitalize">
                  {request.status}
                </Badge>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{position}</h2>
              <p className="text-xs font-medium text-slate-500">
                Created on {fmt(request.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone={URGENCY_TONE[request.urgency] ?? "default"} className="capitalize">
                Urgency: {request.urgency}
              </Badge>
              <Badge tone="info" className="uppercase">
                {employmentType}
              </Badge>
            </div>
          </div>
        </div>

        {/* Primary Meta Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">Department</p>
              <p className="truncate text-sm font-bold text-slate-900">{departmentName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">Requested By</p>
              <p className="truncate text-sm font-bold text-slate-900">{requesterName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Briefcase size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">Headcount Needed</p>
              <p className="text-sm font-bold text-slate-900">{request.headcount || 1} Person(s)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">Target Date</p>
              <p className="text-sm font-bold text-slate-900">{fmt(request.needed_by)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Target size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">Fit Threshold</p>
              <p className="text-sm font-bold text-slate-900">{request.fit_threshold || 70}% Match</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">Job Library</p>
              <p className="truncate text-sm font-bold text-slate-900">
                {request.jobLibrary?.job_title || "Custom Position"}
              </p>
            </div>
          </div>
        </div>

        {/* Justification & Reason */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Justification & Business Reason
          </h3>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
            {request.reason || request.justification || "No justification provided."}
          </div>
        </div>

        {/* Qualifications */}
        {qualifications.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Qualifications & Requirements
            </h3>
            <div className="space-y-3">
              {qualifications.map((qGroup, idx) => (
                <div key={qGroup.id || idx} className="rounded-xl border border-slate-200 bg-white p-4">
                  {qGroup.title && (
                    <h4 className="mb-2 font-bold text-slate-900 text-sm">{qGroup.title}</h4>
                  )}
                  {Array.isArray(qGroup.details) && qGroup.details.length > 0 ? (
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {qGroup.details.map((detail, dIdx) => (
                        <li key={dIdx}>
                          {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                        </li>
                      ))}
                    </ul>
                  ) : typeof qGroup.details === "string" ? (
                    <p className="text-sm text-slate-600">{qGroup.details}</p>
                  ) : (
                    <p className="text-sm text-slate-600">{qGroup.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {responsibilities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Key Responsibilities
            </h3>
            <div className="space-y-3">
              {responsibilities.map((rGroup, idx) => (
                <div key={rGroup.id || idx} className="rounded-xl border border-slate-200 bg-white p-4">
                  {rGroup.title && (
                    <h4 className="mb-2 font-bold text-slate-900 text-sm">{rGroup.title}</h4>
                  )}
                  {Array.isArray(rGroup.details) && rGroup.details.length > 0 ? (
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {rGroup.details.map((detail, dIdx) => (
                        <li key={dIdx}>
                          {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                        </li>
                      ))}
                    </ul>
                  ) : typeof rGroup.details === "string" ? (
                    <p className="text-sm text-slate-600">{rGroup.details}</p>
                  ) : (
                    <p className="text-sm text-slate-600">{rGroup.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remarks / Review Notes */}
        {(request.approval_remarks || request.remarks) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              COO / Executive Review Remarks & Comments
            </h3>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900 font-medium whitespace-pre-wrap">
              {request.approval_remarks || request.remarks}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
