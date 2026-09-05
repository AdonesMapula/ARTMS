import { useState, useEffect } from "react";
import { Building2, User, Calendar, Briefcase, Target, ShieldCheck, X, Loader, RefreshCw } from "lucide-react";
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
      <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-slate-400 text-xs font-medium">
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
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300">
      {/* ── Top Header Banner ────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="rounded bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {prfId}
            </span>
            <Badge tone={STATUS_TONE[request?.status] ?? "default"} className="capitalize text-[10px] py-0 px-1.5">
              {request?.status === "revised" || request?.status === "needs_revision" ? "Needs Revision" : request?.status || "Pending"}
            </Badge>
            <Badge tone={URGENCY_TONE[request?.urgency] ?? "default"} className="capitalize text-[10px] py-0 px-1.5">
              {request?.urgency || "normal"}
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {position}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Dept: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{departmentName}</strong> • {fmt(request?.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (request?.status === "revised" || request?.status === "needs_revision") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(request)}
              className="gap-1 text-[11px] py-1 px-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
            >
              <RefreshCw size={11} />
              <span>Edit</span>
            </Button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
              }}
              aria-label="Close"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Body ──────────────────────────────────────────── */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20 space-y-4">
        {(request?.status === "revised" || request?.status === "needs_revision") && remarksText && (
          <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="rounded-md bg-amber-100 dark:bg-amber-900/60 p-1.5 text-amber-700 dark:text-amber-300 shrink-0">
                <RefreshCw size={14} />
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  COO Revision Instructions
                </h4>
                <p className="mt-1 text-xs font-medium text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                  "{remarksText}"
                </p>
                <p className="mt-1 text-[10px] font-semibold text-amber-800 dark:text-amber-400">
                  Click "Edit" at top right to update and resubmit.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-1.5">
            <Loader size={24} className="animate-spin text-blue-600" />
            <p className="text-[11px] font-medium">Loading details...</p>
          </div>
        ) : (
          <>
            {/* Primary Meta Grid */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                  <Building2 size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{departmentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
                  <User size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Requested By</p>
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{requesterName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
                  <Briefcase size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Headcount</p>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{request?.headcount || 1} Person(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                  <Calendar size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Target Needed By</p>
                  <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{fmt(request?.needed_by)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/60">
                  <Target size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">AI Fit Threshold</p>
                  <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{request?.fit_threshold || 70}% Match</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/60">
                  <ShieldCheck size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Employment Type</p>
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{employmentType}</p>
                </div>
              </div>
            </div>

            {/* Requirement Status Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Employment Status
                </h4>
                <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                  {displayEmpStatus}
                </div>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Plantilla Requirement
                </h4>
                <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                  {displayPlantType}
                  {replFor && <span className="text-slate-500 font-normal"> (for {replFor})</span>}
                </div>
              </div>
            </div>

            {/* Qualifications */}
            {qualifications.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Qualifications & Requirements
                </h4>
                <div className="space-y-2">
                  {qualifications.map((qGroup, idx) => (
                    <div key={qGroup.id || idx} className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                      {qGroup.title && (
                        <h5 className="mb-1.5 font-bold text-slate-900 dark:text-white text-xs">{qGroup.title}</h5>
                      )}
                      {Array.isArray(qGroup.details) && qGroup.details.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-400">
                          {qGroup.details.map((detail, dIdx) => (
                            <li key={dIdx}>
                              {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600 dark:text-slate-400">{qGroup.title || String(qGroup.details || "")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Key Responsibilities
                </h4>
                <div className="space-y-2">
                  {responsibilities.map((rGroup, idx) => (
                    <div key={rGroup.id || idx} className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                      {rGroup.title && (
                        <h5 className="mb-1.5 font-bold text-slate-900 dark:text-white text-xs">{rGroup.title}</h5>
                      )}
                      {Array.isArray(rGroup.details) && rGroup.details.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-400">
                          {rGroup.details.map((detail, dIdx) => (
                            <li key={dIdx}>
                              {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600 dark:text-slate-400">{rGroup.title || String(rGroup.details || "")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Executive Remarks */}
            {(request?.approval_remarks || request?.remarks) && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Review Remarks & Executive Notes
                </h4>
                <div className="rounded-md border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-300 font-medium whitespace-pre-wrap">
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
