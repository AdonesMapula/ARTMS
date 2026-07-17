import { useEffect, useMemo, useState } from "react";
import { 
  MapPin, Briefcase, Filter, Calendar, Search, Clock, 
  GraduationCap, Building2, Award, FileText, Users, 
  CheckCircle2, AlertCircle, Upload, Loader2, Mail, 
  Phone, MapPinned, Globe, MessageSquare, X 
} from "lucide-react";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import AlertModal from "../../components/ui/AlertModal";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [page, setPage] = useState(1);
  const [alertModal, setAlertModal] = useState({ open: false, variant: "info", title: "", message: "" });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [files, setFiles] = useState({ resume: null, supporting: null });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    coverLetter: "",
  });
  const pageSize = 6;

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/public/job-postings`);
      setJobs(response.data.data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Failed to Load Jobs",
        message: "Unable to fetch job postings. Please refresh the page or try again later.",
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/public/job-postings/${jobId}`);
      setSelectedJob(response.data.posting || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching job details:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Failed to Load Job Details",
        message: "Unable to fetch job details. Please try again.",
      });
    }
  };

  const handleApplyNow = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/public/job-postings/${jobId}`);
      setSelectedJob(response.data.posting || response.data);
      setShowApplyModal(true);
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error fetching job:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Failed to Load Application",
        message: "Unable to load application form. Please try again.",
      });
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setFiles((s) => ({ ...s, resume: file }));
    setParsing(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("resume", file);

      const response = await axios.post(`${API_URL}/public/parse-resume`, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success && response.data.data) {
        const parsed = response.data.data;
        setFormData((prev) => ({
          ...prev,
          firstName: parsed.firstName || prev.firstName,
          lastName: parsed.lastName || prev.lastName,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          location: parsed.location || prev.location,
        }));

        setAlertModal({
          open: true,
          variant: "success",
          title: "Resume Parsed Successfully",
          message: "Your resume has been analyzed and form fields have been auto-filled.",
        });
      }
    } catch (error) {
      console.error("Error parsing resume:", error);
      setAlertModal({
        open: true,
        variant: "warning",
        title: "Partial Parsing",
        message: "We couldn't fully parse your resume. Please fill in the remaining fields manually.",
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSubmitApplication = () => {
    // Placeholder - add real submission logic here
    setAlertModal({
      open: true,
      variant: "success",
      title: "Application Submitted",
      message: "Your application has been submitted successfully. We'll review it and get back to you soon!",
    });
    setShowApplyModal(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: "",
      coverLetter: "",
    });
    setFiles({ resume: null, supporting: null });
  };

  // Parse additional description field
  const parseAdditionalInfo = (job) => {
    const desc = job.additional_description || job.description || "";
    const parts = desc.split("|").map(p => p.trim());
    const info = {};
    
    parts.forEach(part => {
      if (part.includes("Educational Background:")) {
        info.education = part.replace("Educational Background:", "").trim();
      } else if (part.includes("Work Experience:")) {
        info.workExp = part.replace("Work Experience:", "").trim();
      } else if (part.includes("Skills:")) {
        info.skills = part.replace("Skills:", "").trim();
      } else if (part.includes("Other:")) {
        info.other = part.replace("Other:", "").trim();
      } else if (part.includes("Employment Status:")) {
        info.employmentStatus = part.replace("Employment Status:", "").trim();
      } else if (part.includes("Plantilla Type:")) {
        info.plantillaType = part.replace("Plantilla Type:", "").trim();
      }
    });
    
    return info;
  };

  const departments = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department?.name).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesQuery =
        !q ||
        j.job_library?.job_title?.toLowerCase().includes(q) ||
        j.department?.name?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q);
      const matchesDept = dept === "all" || j.department?.name === dept;
      return matchesQuery && matchesDept;
    });
  }, [query, dept, jobs]);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#111A62]"></div>
            <p className="text-sm font-medium text-slate-600">Loading job openings...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#111A62] via-[#1a2575] to-[#111A62] px-6 py-20 lg:px-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Search className="h-4 w-4 text-[#F97316]" />
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Career Opportunities
              </p>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Discover Your Next
              <span className="block text-[#F97316]">Career Move</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base text-slate-200 sm:text-lg">
              Explore exciting opportunities across departments. Search, filter, and apply online—no account required.
            </p>
            
            {/* Stats Bar */}
            <div className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
                <p className="text-3xl font-extrabold text-white">{jobs.length}</p>
                <p className="mt-1 text-sm text-slate-300">Open Positions</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
                <p className="text-3xl font-extrabold text-white">{departments.length - 1}</p>
                <p className="mt-1 text-sm text-slate-300">Departments</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm sm:col-span-1">
                <p className="text-3xl font-extrabold text-white">100%</p>
                <p className="mt-1 text-sm text-slate-300">Remote-Friendly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Search and Filters */}
        <div className="relative -mt-16 rounded-2xl border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#111A62]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#111A62]">
              Filter & Search
            </h2>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus-within:border-[#111A62] focus-within:ring-2 focus-within:ring-[#111A62]/20">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job title, keyword, or skills..."
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
              className="flex-1 border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => { setPage(1); setDept("all"); }}
              variant={dept === "all" ? "primary" : "outline"}
              className={dept === "all" ? "bg-[#F97316] hover:bg-[#ea6a0a]" : "border-slate-300 text-slate-700 hover:bg-slate-100"}
            >
              All Roles
            </Button>
            {departments.filter(d => d !== "all").map((d) => (
              <Button
                key={d}
                onClick={() => { setPage(1); setDept(d); }}
                variant={dept === d ? "primary" : "outline"}
                className={dept === d ? "bg-[#F97316] hover:bg-[#ea6a0a]" : "border-slate-300 text-slate-700 hover:bg-slate-100"}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold text-[#111A62]">{total}</span> opening
            {total === 1 ? "" : "s"}
          </p>
          {filtered.length !== jobs.length && (
            <p className="text-xs text-slate-500">Filtered from {jobs.length} total</p>
          )}
        </div>

        {/* Job Cards - Reference Design */}
        {pageItems.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No matching jobs found"
              description="Try adjusting your search criteria or reset filters to see all available positions."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((job) => (
              <Card 
                key={job.id} 
                className="group relative overflow-hidden border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-lg"
              >
                {/* Vacancy Badge - Top Right */}
                <div className="absolute right-4 top-4">
                  <Badge className="bg-[#F97316]/10 text-[#F97316] text-xs font-semibold">
                    {job.vacancies_count} {job.vacancies_count > 1 ? "Vacancies" : "Vacancy"}
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  {/* Department Badge */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#F97316]">
                      {job.department?.name || "N/A"}
                    </span>
                  </div>
                  
                  {/* Job Title */}
                  <CardTitle className="pr-16 text-lg font-bold text-[#111A62] leading-snug">
                    {job.job_library?.job_title || "Untitled Position"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Meta Info */}
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{job.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span>Full-time</span>
                    </div>
                  </div>

                  {/* Description Preview */}
                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {job.description || job.job_library?.job_description || "No description available."}
                  </p>

                  {/* Deadline */}
                  {job.closing_date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Apply by {new Date(job.closing_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      onClick={() => handleViewDetails(job.id)}
                      variant="outline"
                      size="sm"
                      className="w-full border-[#111A62] text-[#111A62] hover:bg-[#111A62] hover:text-white"
                    >
                      View Details
                    </Button>
                    <Button 
                      onClick={() => handleApplyNow(job.id)}
                      size="sm"
                      className="w-full bg-[#111A62] text-white hover:bg-[#0d1550]"
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </section>

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
      />

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          open={showDetailsModal}
          job={selectedJob}
          onClose={() => setShowDetailsModal(false)}
          onApply={() => handleApplyNow(selectedJob.id)}
          parseAdditionalInfo={parseAdditionalInfo}
        />
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <ApplyModal
          open={showApplyModal}
          job={selectedJob}
          formData={formData}
          setFormData={setFormData}
          files={files}
          setFiles={setFiles}
          parsing={parsing}
          handleResumeUpload={handleResumeUpload}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleSubmitApplication}
        />
      )}
    </div>
  );
}

// Job Details Modal Component
function JobDetailsModal({ open, job, onClose, onApply, parseAdditionalInfo }) {
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
              {department.name || "N/A"}
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

// Apply Modal Component
function ApplyModal({ open, job, formData, setFormData, files, setFiles, parsing, handleResumeUpload, onClose, onSubmit }) {
  if (!job) return null;
  
  const jobTitle = job.job_library?.job_title || "this position";
  const department = job.department?.name || "N/A";

  return (
    <Modal
      open={open}
      title=""
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-1">
        {/* Header */}
        <div className="mb-6 rounded-xl bg-gradient-to-br from-[#F97316] to-[#ea6a0a] p-6 text-white">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Application Form</span>
          </div>
          <h2 className="text-2xl font-extrabold">Apply for {jobTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white">
              <Briefcase className="mr-1 h-3.5 w-3.5" />
              {department}
            </Badge>
            <Badge className="bg-white/20 text-white">
              <Users className="mr-1 h-3.5 w-3.5" />
              {job.vacancies_count} {job.vacancies_count > 1 ? "openings" : "opening"}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#111A62]" />
              <h3 className="font-bold text-[#111A62]">Personal Information</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                placeholder="e.g., Alex"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                icon={<Users className="h-4 w-4" />}
              />
              <Input
                label="Last Name"
                placeholder="e.g., Rivera"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                icon={<Users className="h-4 w-4" />}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Mobile Number"
                placeholder="+63..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                icon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="Current Location"
                placeholder="City, Province"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                icon={<MapPinned className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Resume Upload */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#F97316]" />
              <h3 className="font-bold text-[#111A62]">Resume & Documents</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FileUploadField
                label="Resume (PDF/Image)"
                file={files.resume}
                parsing={parsing}
                onChange={handleResumeUpload}
              />
              <FileUploadField
                label="Supporting Documents (optional)"
                file={files.supporting}
                onChange={(f) => setFiles((s) => ({ ...s, supporting: f }))}
              />
            </div>
            {parsing && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#111A62]/5 border border-[#111A62]/10 px-3 py-2 text-sm text-[#111A62]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing your resume with AI...</span>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Upload your resume and we'll automatically extract information to fill the form fields.
            </p>
          </div>

          {/* Additional Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#111A62]" />
              <h3 className="font-bold text-[#111A62]">Additional Details (Optional)</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="LinkedIn Profile"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                icon={<Globe className="h-4 w-4" />}
              />
              <Input
                label="Portfolio / Website"
                placeholder="https://..."
                value={formData.portfolio}
                onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                icon={<Globe className="h-4 w-4" />}
              />
              <div className="sm:col-span-2">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <MessageSquare className="h-4 w-4 text-[#F97316]" />
                  Short Cover Note
                </label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#111A62] focus:ring-2 focus:ring-[#111A62]/20"
                  placeholder="Tell us briefly why you're a great fit..."
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-slate-500">
              By submitting, you confirm the information provided is accurate.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="border-slate-300">
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                className="bg-[#F97316] hover:bg-[#ea6a0a]"
              >
                Submit Application
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// File Upload Component
function FileUploadField({ label, file, parsing, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</label>
      <label
        className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed ${
          parsing ? "border-[#111A62] bg-[#111A62]/5" : "border-slate-300 bg-white hover:bg-slate-50"
        } text-sm text-slate-600 transition`}
      >
        {parsing ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#111A62]" />
        ) : (
          <Upload className="h-6 w-6 text-slate-500" />
        )}
        <span className="font-semibold text-slate-700">
          {file?.name || "Click to choose a file"}
        </span>
        {parsing && <span className="text-xs text-[#111A62]">Parsing...</span>}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(e) => onChange?.(e.target.files?.[0] || null)}
          disabled={parsing}
        />
      </label>
    </div>
  );
}

