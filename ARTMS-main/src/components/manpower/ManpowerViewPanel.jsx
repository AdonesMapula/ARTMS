import { useState, useEffect } from "react";
import { Building2, User, Calendar, Briefcase, Target, ShieldCheck, X, CheckCircle, XCircle, AlertCircle, Loader, RefreshCw } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import manpowerService from "../../services/manpowerService";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const URGENCY_TONE = { low: "default", medium: "info", high: "warning", critical: "danger" };
const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger", revised: "warning", needs_revision: "warning" };

export default function ManpowerViewPanel({ requestId, onClose, onEdit, onUpdated }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!requestId) return;
    loadDetails();
  }, [requestId]);

  const loadDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await manpowerService.getById(requestId);
      setRequest(res.data?.request || res.data || null);
    } catch (err) {
      setErrorMsg("Failed to load manpower request details.");
    } finally {
      setLoading(false);
    }
  };

  if (!request && !loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Request not found or removed.
      </div>
    );
  }

  const prfId = `PRF-${String(request?.id || requestId).padStart(3, "0")}`;
  const position = request?.position_needed || request?.jobLibrary?.job_title || "Unspecified Position";
  const departmentName = request?.department?.name || request?.department?.department_name || request?.department_name || "—";
  const requesterName = request?.requester?.name || request?.requested_by || "—";
  const employmentType = request?.employment_type ? request.employment_type.replace('_', ' ').toUpperCase() : "FULL TIME";
  const remarksText = request?.approval_remarks || request?.remarks;

  const qualifications = Array.isArray(request?.qualifications)
    ? request.qualifications
    : typeof request?.qualifications === "string" && request.qualifications
    ? [{ id: "1", title: "General Qualifications", details: [request.qualifications] }]
    : [];

  const responsibilities = Array.isArray(request?.responsibilities)
    ? request.responsibilities
    : typeof request?.responsibilities === "string" && request.responsibilities
    ? [{ id: "1", title: "Core Responsibilities", details: [request.responsibilities] }]
    : [];

  // Parse employment_status & plantilla_type
  let empStatus = request?.employment_status ?? "";
  let plantType = request?.plantilla_type ?? "";
  let replFor = request?.replacement_for ?? "";

  const rawJustification = request?.reason || request?.justification || "";

  if (!empStatus && rawJustification) {
    const empMatch = rawJustification.match(/Employment Status:\s*([^|]+)/i);
    if (empMatch) empStatus = empMatch[1].trim();
  }
  if (!plantType && rawJustification) {
    const plantMatch = rawJustification.match(/Plantilla Type:\s*([^|]+)/i);
    if (plantMatch) plantType = plantMatch[1].trim();
  }
  if (!replFor && rawJustification) {
    const replMatch = rawJustification.match(/Replacement For:\s*([^|]+)/i);
    if (replMatch) replFor = replMatch[1].trim();
  }

  const displayEmpStatus = empStatus ? empStatus.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—";
  const displayPlantType = plantType ? plantType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300">
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="shrink-0 bg-gradient-to-r from-[#111A62] via-[#1a257c] to-[#0d1550] px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wide text-white">
                {prfId}
              </span>
              <Badge tone={STATUS_TONE[request?.status] ?? "default"} className="capitalize">
                {request?.status === "revised" || request?.status === "needs_revision" ? "Needs Revision" : request?.status || "Pending"}
              </Badge>
              <Badge tone={URGENCY_TONE[request?.urgency] ?? "default"} className="capitalize">
                Urgency: {request?.urgency || "normal"}
              </Badge>
            </div>
            <h2 className="text-xl font-extrabold text-white truncate">{position}</h2>
            <p className="text-xs text-slate-300">
              Department: <strong className="text-white">{departmentName}</strong> • Created on {fmt(request?.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (request?.status === "revised" || request?.status === "needs_revision") && (
              <button
                onClick={() => onEdit(request)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 hover:border-amber-500 transition cursor-pointer"
                title="Edit & Resubmit PRF"
              >
                <RefreshCw size={15} />
                <span>Edit & Resubmit</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                title="Close Details Panel"
              >
                <X size={15} />
                <span>Close Details</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Body ──────────────────────────────────────────── */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto bg-slate-50/50 space-y-6">
        {(request?.status === "revised" || request?.status === "needs_revision") && remarksText && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2.5 text-amber-700">
                <RefreshCw size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-900">
                  COO Revision Instructions & Remarks
                </h4>
                <p className="mt-2 text-[15px] font-medium text-amber-900 whitespace-pre-wrap leading-relaxed">
                  "{remarksText}"
                </p>
                <p className="mt-3 text-xs font-semibold text-amber-800">
                  💡 Click "Edit & Resubmit" at the top right to make these changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader size={32} className="animate-spin text-[#111A62]" />
            <p className="text-xs font-semibold">Loading Manpower Requisition Details...</p>
          </div>
        ) : (
          <>
            {/* Primary Meta Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Department</p>
                  <p className="truncate text-xs font-extrabold text-slate-900">{departmentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Requested By</p>
                  <p className="truncate text-xs font-extrabold text-slate-900">{requesterName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Briefcase size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Headcount Needed</p>
                  <p className="text-xs font-extrabold text-slate-900">{request?.headcount || 1} Person(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Target Needed By</p>
                  <p className="text-xs font-extrabold text-slate-900">{fmt(request?.needed_by)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Target size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">AI Fit Threshold</p>
                  <p className="text-xs font-extrabold text-slate-900">{request?.fit_threshold || 70}% Match</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Employment Type</p>
                  <p className="truncate text-xs font-extrabold text-slate-900">{employmentType}</p>
                </div>
              </div>
            </div>

            {/* Requirement Status Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Employment Status
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 font-bold">
                  {displayEmpStatus}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Plantilla Requirement
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 font-bold">
                  {displayPlantType}
                  {replFor && <span className="text-slate-500 font-normal"> (for {replFor})</span>}
                </div>
              </div>
            </div>

            {/* Qualifications */}
            {qualifications.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Qualifications & Requirements
                </h3>
                <div className="space-y-2">
                  {qualifications.map((qGroup, idx) => (
                    <div key={qGroup.id || idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                      {qGroup.title && (
                        <h4 className="mb-2 font-bold text-slate-900 text-xs">{qGroup.title}</h4>
                      )}
                      {Array.isArray(qGroup.details) && qGroup.details.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                          {qGroup.details.map((detail, dIdx) => (
                            <li key={dIdx}>
                              {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600">{qGroup.title || String(qGroup.details || "")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Key Responsibilities
                </h3>
                <div className="space-y-2">
                  {responsibilities.map((rGroup, idx) => (
                    <div key={rGroup.id || idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                      {rGroup.title && (
                        <h4 className="mb-2 font-bold text-slate-900 text-xs">{rGroup.title}</h4>
                      )}
                      {Array.isArray(rGroup.details) && rGroup.details.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                          {rGroup.details.map((detail, dIdx) => (
                            <li key={dIdx}>
                              {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600">{rGroup.title || String(rGroup.details || "")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Executive Remarks */}
            {(request?.approval_remarks || request?.remarks) && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Review Remarks & Executive Notes
                </h3>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 font-medium whitespace-pre-wrap">
                  {request.approval_remarks || request.remarks}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
