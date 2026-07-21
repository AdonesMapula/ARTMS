import { 
  MapPin, Briefcase, Calendar, Clock, 
  GraduationCap, Building2, Award, FileText, Users, 
  CheckCircle2, AlertCircle 
} from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

/**
 * JobDetailsModal - Displays detailed job information
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {object} job - Job posting data
 * @param {function} onClose - Close callback
 * @param {function} onApply - Apply callback
 * @param {function} parseAdditionalInfo - Function to parse additional job info
 */
export default function JobDetailsModal({ open, job, onClose, onApply, parseAdditionalInfo }) {
  if (!job) return null;
  
  const jobLibrary = job.job_library || {};
  const department = job.department || {};
  const additionalInfo = parseAdditionalInfo(job);

  return (
    <Modal
      open={open}
      title=""
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-1">
        {/* Header */}
        <div className="mb-6 rounded-xl bg-gradient-to-br from-[#111A62] to-[#1a2575] p-6 text-white">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <Briefcase className="h-3.5 w-3.5 text-[#F97316]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {department.department_name ?? department.name ?? "N/A"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold">{jobLibrary.job_title || "Untitled Position"}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-200">
            {job.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#F97316]" />
                {job.location}
              </span>
            )}
            {job.posting_date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Posted {new Date(job.posting_date).toLocaleDateString()}
              </span>
            )}
            {job.closing_date && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Closes {new Date(job.closing_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="mt-4">
            <Badge className="bg-[#F97316] text-white">
              <Users className="mr-1 h-3.5 w-3.5" />
              {job.vacancies_count} {job.vacancies_count > 1 ? "Openings" : "Opening"}
            </Badge>
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-4">
          {/* Job Description */}
          {(job.description || jobLibrary.job_description) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#111A62]" />
                <h3 className="font-bold text-[#111A62]">Job Description</h3>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {job.description || jobLibrary.job_description}
              </p>
            </div>
          )}

          {/* Responsibilities & Qualifications */}
          <div className="grid gap-4 md:grid-cols-2">
            {jobLibrary.responsibilities && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#F97316]" />
                  <h3 className="font-bold text-[#111A62]">Responsibilities</h3>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {jobLibrary.responsibilities}
                </p>
              </div>
            )}
            {jobLibrary.qualifications && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#F97316]" />
                  <h3 className="font-bold text-[#111A62]">Qualifications</h3>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {jobLibrary.qualifications}
                </p>
              </div>
            )}
          </div>

          {/* Additional Requirements */}
          {(additionalInfo.education || additionalInfo.workExp || additionalInfo.skills || additionalInfo.other) && (
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#111A62]" />
                <h3 className="font-bold text-[#111A62]">Additional Requirements</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {additionalInfo.education && (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111A62]/10">
                      <GraduationCap className="h-5 w-5 text-[#111A62]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Educational Background</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{additionalInfo.education}</p>
                    </div>
                  </div>
                )}
                {additionalInfo.workExp && (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/10">
                      <Briefcase className="h-5 w-5 text-[#F97316]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Work Experience</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{additionalInfo.workExp}</p>
                    </div>
                  </div>
                )}
                {additionalInfo.skills && (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111A62]/10">
                      <Award className="h-5 w-5 text-[#111A62]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Skills Required</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{additionalInfo.skills}</p>
                    </div>
                  </div>
                )}
                {additionalInfo.employmentStatus && (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/10">
                      <Building2 className="h-5 w-5 text-[#F97316]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Employment Status</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{additionalInfo.employmentStatus}</p>
                    </div>
                  </div>
                )}
                {additionalInfo.plantillaType && (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111A62]/10">
                      <FileText className="h-5 w-5 text-[#111A62]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Plantilla Type</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{additionalInfo.plantillaType}</p>
                    </div>
                  </div>
                )}
                {additionalInfo.other && (
                  <div className="flex gap-3 sm:col-span-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <AlertCircle className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Other Requirements</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{additionalInfo.other}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-xl border-2 border-[#F97316]/20 bg-gradient-to-br from-orange-50 to-white p-6 text-center">
            <h3 className="text-lg font-extrabold text-[#111A62]">Ready to Join Us?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Take the next step in your career. Apply now and our team will review your application.
            </p>
            <Button
              onClick={onApply}
              className="mt-4 bg-[#F97316] px-8 py-3 font-bold hover:bg-[#ea6a0a]"
            >
              Start Application
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
