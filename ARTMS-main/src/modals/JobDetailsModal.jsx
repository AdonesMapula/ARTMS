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
export default function JobDetailsModal({ open, job, onClose, onApply }) {
  if (!job) return null;
  
  const jobLibrary = job.job_library || {};
  const department = job.department || {};

  const qualifications = job.qualifications || jobLibrary.qualifications || [];
  const responsibilities = job.responsibilities || jobLibrary.responsibilities || [];

  const NestedListRenderer = ({ items, label }) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#F97316]" />
            <h3 className="font-bold text-[#111A62]">{label}</h3>
          </div>
          <p className="text-sm text-slate-500 italic">No specific {label.toLowerCase()} provided.</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#F97316]" />
          <h3 className="font-bold text-[#111A62]">{label}</h3>
        </div>
        <div className="space-y-4">
          {items.map((block, idx) => (
            <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-3 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800">{block.title}</h4>
              {block.details && block.details.length > 0 && (
                <ul className="mt-2 space-y-1 pl-4 list-disc marker:text-slate-300">
                  {block.details.map((detail, dIdx) => (
                    <li key={dIdx} className="text-sm text-slate-600 pl-1 leading-relaxed">
                      {detail.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
            <NestedListRenderer items={responsibilities} label="Responsibilities" />
            <NestedListRenderer items={qualifications} label="Qualifications" />
          </div>

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
