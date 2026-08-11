import { useState, useEffect } from "react";
import { BookOpen, Briefcase, User, Calendar, DollarSign, CheckCircle, XCircle, Clock, X, Loader, Edit, Check, AlertTriangle } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import api from "../../services/api";
import { calculateSalaryBreakdown } from "../../utils/salaryUtils";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const APPROVAL_TONE = {
  approved: "success",
  pending: "warning",
  revised: "warning",
  rejected: "danger",
};

export default function JobLibraryViewPanel({ jobId, initialJob, onClose, onUpdated, onEdit, onApprove }) {
  const toast = useToast();
  const { user } = useAuth();
  const isCOO = user?.role === "coo" || user?.role === "super_admin";
  const [loading, setLoading] = useState(!initialJob);
  const [job, setJob] = useState(initialJob || null);

  useEffect(() => {
    if (initialJob) {
      setJob(initialJob);
      setLoading(false);
    }
    if (jobId) {
      loadJob();
    }
  }, [jobId, initialJob]);

  const loadJob = async () => {
    try {
      const res = await api.get(`/job-library/${jobId}`);
      const jobData = res.data?.job || res.data?.data || res.data;
      if (jobData && typeof jobData === 'object' && jobData.job_title) {
        setJob(jobData);
      }
    } catch (err) {
      console.error("Failed to load job template details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!job && !loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Job template not found.
      </div>
    );
  }

  const jlId = `JL-${String(job?.id || jobId).padStart(3, "0")}`;
  const salaryBreakdown = calculateSalaryBreakdown(job?.salary_min, job?.salary_max, job?.salary_type);
  const qualifications = Array.isArray(job?.qualifications) ? job.qualifications : [];
  const responsibilities = Array.isArray(job?.responsibilities) ? job.responsibilities : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-full transition-all duration-300">
      
      {/* ── Top Header Banner (Styled like Modal.jsx) ────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wide text-slate-700">
              {jlId}
            </span>
            <Badge tone={APPROVAL_TONE[job?.approval_status] || "default"} className="capitalize">
              {job?.approval_status || "Pending"}
            </Badge>
          </div>
          <h3 className="text-lg font-extrabold text-[#111A62] tracking-tight truncate">
            {job?.job_title || "Job Template Details"}
          </h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed truncate">
            Category: <strong className="text-slate-800">{job?.job_category || "General"}</strong> • Created by {job?.creator?.name || "HR Admin"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (job?.approval_status === "pending" || job?.approval_status === "revised") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(job)}
              className="gap-1.5 text-slate-600 bg-white shadow-sm"
            >
              <Edit size={14} />
              <span>Edit Template</span>
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
              className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95 cursor-pointer shadow-sm"
            >
              <X className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Body ──────────────────────────────────────────── */}
      <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto space-y-6 bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader size={32} className="animate-spin text-[#111A62]" />
            <p className="text-xs font-semibold">Loading Job Template Details...</p>
          </div>
        ) : (
          <>
            {/* Salary Breakdown Summary Card */}
            {salaryBreakdown && (
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">Approved Compensation Breakdown</p>
                    <p className="text-lg font-black text-emerald-900 mt-0.5">{salaryBreakdown.formatted.monthly}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 flex-wrap">
                    <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">Daily: {salaryBreakdown.formatted.daily}</span>
                    <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">Hourly: {salaryBreakdown.formatted.hourly}</span>
                  </div>
                </div>
              </div>
            )}

            {/* COO Rejection Feedback Box */}
            {job?.approval_status === "rejected" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1 shadow-sm mb-4">
                <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs">
                  <XCircle size={16} className="text-red-600" /> COO Rejection Remarks & Feedback:
                </div>
                <p className="text-xs text-red-800 leading-relaxed font-medium mt-1">
                  {job.approval_remarks || job.remarks || "No specific feedback or remarks provided by the COO."}
                </p>
              </div>
            )}

            {/* COO Revision Feedback Box */}
            {job?.approval_status === "revised" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1 shadow-sm mb-4">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <AlertTriangle size={16} className="text-amber-600" /> Action Required: COO Revision Feedback
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium mt-1">
                  {job.approval_remarks || job.remarks || "No specific revision details provided by the COO."}
                </p>
              </div>
            )}

            {/* Meta Details Grid */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Briefcase size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Employment Type</p>
                  <p className="truncate text-xs font-bold text-slate-900 capitalize">
                    {job?.employment_type ? job.employment_type.replace('_', ' ') : 'Full Time'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Category</p>
                  <p className="truncate text-xs font-bold text-slate-900">{job?.job_category || "General"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <User size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Author</p>
                  <p className="truncate text-xs font-bold text-slate-900">{job?.creator?.name || "HR Admin"}</p>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Job Overview & Overview Summary
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 font-medium">
                {job?.job_description || "No job overview description available."}
              </div>
            </div>

            {/* Qualifications List */}
            {qualifications.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mt-6">
                  Qualifications & Requirements
                </h3>
                <div className="space-y-2">
                  {qualifications.map((qGroup, idx) => (
                    <div key={qGroup.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      {qGroup.title && (
                        <h4 className="mb-2 font-bold text-slate-900 text-xs">{qGroup.title}</h4>
                      )}
                      {Array.isArray(qGroup.details) && qGroup.details.length > 0 ? (
                        <ul className="space-y-1.5 list-none pl-0 m-0">
                          {qGroup.details.map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400 pl-1"></span>
                              <span className="text-sm text-slate-700 leading-relaxed">
                                {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-600">{qGroup.title || String(qGroup.details || "")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Responsibilities List */}
            {responsibilities.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mt-6">
                  Core Key Responsibilities
                </h3>
                <div className="space-y-2">
                  {responsibilities.map((rGroup, idx) => (
                    <div key={rGroup.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      {rGroup.title && (
                        <h4 className="mb-2 font-bold text-slate-900 text-xs">{rGroup.title}</h4>
                      )}
                      {Array.isArray(rGroup.details) && rGroup.details.length > 0 ? (
                        <ul className="space-y-1.5 list-none pl-0 m-0">
                          {rGroup.details.map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400 pl-1"></span>
                              <span className="text-sm text-slate-700 leading-relaxed">
                                {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-600">{rGroup.title || String(rGroup.details || "")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
