import { FileText } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { calculateSalaryBreakdown } from "../utils/salaryUtils";

export default function JobLibraryViewModal({ open, job, onClose }) {
  if (!open || !job) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-3xl"
      title="View Job Entry"
      description={`Viewing details for "${job.job_title}"`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Job Details Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                {job.job_title}
              </h3>
              <span className="text-xs text-slate-400">
                JL-{String(job.id).padStart(3, "0")}
              </span>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-500">Category</p>
              <p className="text-sm font-medium text-slate-900">
                {job.job_category || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Employment Type
              </p>
              <Badge tone="accent" className="mt-1">
                {job.employment_type?.replace(/_/g, " ") || "—"}
              </Badge>
            </div>
            {(() => {
              const bd = calculateSalaryBreakdown(job.salary_min, job.salary_max, job.salary_type);
              if (!bd) return null;
              return (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Compensation & Rate Breakdown
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500">Monthly Salary</p>
                      <p className="text-sm font-extrabold text-[#111A62] mt-0.5">{bd.formatted.monthly}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500">Weekly Rate</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{bd.formatted.weekly}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500">Daily Rate</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{bd.formatted.daily}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500">Hourly Rate</p>
                      <p className="text-sm font-bold text-[#111A62] mt-0.5">{bd.formatted.hourly}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Description */}
          {job.job_description && (
            <div className="mb-4 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-semibold text-slate-700">
                Description
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                {job.job_description}
              </p>
            </div>
          )}

          {/* Qualifications & Responsibilities Grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-slate-200">
            {/* Qualifications */}
            <div className="flex flex-col h-full pt-2">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Qualifications
              </p>
              {job.qualifications && Array.isArray(job.qualifications) && job.qualifications.length > 0 ? (
                <div className="space-y-3">
                  {job.qualifications.map((block, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800">{block.title}</h4>
                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-4 list-disc marker:text-slate-300">
                          {block.details.map((detail, dIdx) => (
                            <li key={dIdx} className="text-sm text-slate-600 pl-1 leading-relaxed">
                              {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No qualifications added.</p>
              )}
            </div>

            {/* Responsibilities */}
            <div className="flex flex-col h-full pt-2 sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Responsibilities
              </p>
              {job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0 ? (
                <div className="space-y-3">
                  {job.responsibilities.map((block, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800">{block.title}</h4>
                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-4 list-disc marker:text-slate-300">
                          {block.details.map((detail, dIdx) => (
                            <li key={dIdx} className="text-sm text-slate-600 pl-1 leading-relaxed">
                              {typeof detail === "object" && detail !== null ? (detail.value ?? detail.title ?? "") : String(detail ?? "")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No responsibilities added.</p>
              )}
            </div>
          </div>

          {/* COO / Executive Review Remarks */}
          {(job.approval_remarks || job.remarks) && (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                COO / Executive Review Remarks & Comments
              </h3>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900 font-medium whitespace-pre-wrap">
                {job.approval_remarks || job.remarks}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
