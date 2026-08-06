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
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="shrink-0 bg-gradient-to-r from-[#111A62] via-[#1a257c] to-[#0d1550] px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wide text-white">
                {jlId}
              </span>
              <Badge tone={APPROVAL_TONE[job?.approval_status] || "default"} className="capitalize">
                {job?.approval_status || "Pending"}
              </Badge>
            </div>
            <h2 className="text-xl font-extrabold text-white truncate">{job?.job_title || "Job Template"}</h2>
            <p className="text-xs text-slate-300">
              Category: <strong className="text-white">{job?.job_category || "General"}</strong> • Created by {job?.creator?.name || "HR Admin"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(job)}
                className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                title="Edit Job Template"
              >
                <Edit size={14} />
                <span>Edit</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                title="Close Details Panel"
              >
                <X size={15} />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Body ──────────────────────────────────────────── */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto bg-slate-50/50 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader size={32} className="animate-spin text-[#111A62]" />
            <p className="text-xs font-semibold">Loading Job Template Details...</p>
          </div>
        ) : (
          <>
            {/* Salary Breakdown Summary Card */}
            {salaryBreakdown && (
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-2xs">
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
            {job?.approval_status === "rejected" && (job?.approval_remarks || job?.remarks) && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-1">
                <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs">
                  <XCircle size={16} className="text-red-600" /> COO Rejection Remarks & Feedback:
                </div>
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                  {job.approval_remarks || job.remarks}
                </p>
              </div>
            )}

            {/* Meta Details Grid */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Employment Type</p>
                  <p className="truncate text-xs font-bold text-slate-900 capitalize">
                    {job?.employment_type ? job.employment_type.replace('_', ' ') : 'Full Time'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                  <p className="truncate text-xs font-bold text-slate-900">{job?.job_category || "General"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <User size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Author</p>
                  <p className="truncate text-xs font-bold text-slate-900">{job?.creator?.name || "HR Admin"}</p>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Job Overview & Overview Summary
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700 font-medium">
                {job?.job_description || "No job overview description available."}
              </div>
            </div>

            {/* Qualifications List */}
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

            {/* Key Responsibilities List */}
            {responsibilities.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Core Key Responsibilities
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
          </>
        )}
      </div>
    </div>
  );
}
