import { useEffect, useMemo, useState } from "react";
import { 
  MapPin, Briefcase, Filter, Calendar, Search, Clock
} from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import AlertModal from "../../components/ui/AlertModal";
import { JobDetailsModal, ApplyModal } from "../../modals";
import Reveal from "../../components/ui/Reavel";
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
      setShowDetailsModal(false); // Close details modal if open
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
    const set = new Set(jobs.map((j) => j.department?.department_name ?? j.department?.name).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const deptName = j.department?.department_name ?? j.department?.name ?? "";
      const matchesQuery =
        !q ||
        j.job_library?.job_title?.toLowerCase().includes(q) ||
        deptName.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q);
      const matchesDept = dept === "all" || deptName === dept;
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
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Search className="h-4 w-4 text-[#F97316]" />
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  Career Opportunities
                </p>
              </div>
            </Reveal>
            
            <Reveal delay={100}>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Discover Your Next
                <span className="block text-[#F97316]">Career Move</span>
              </h1>
            </Reveal>
            
            <Reveal delay={200}>
              <p className="mt-6 max-w-3xl text-base text-slate-200 sm:text-lg">
                Explore exciting opportunities across departments. Search, filter, and apply online—no account required.
              </p>
            </Reveal>
            
            {/* Stats Bar */}
            <div className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
              <Reveal delay={300}>
                <div className="rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
                  <p className="text-3xl font-extrabold text-white">{jobs.length}</p>
                  <p className="mt-1 text-sm text-slate-300">Open Positions</p>
                </div>
              </Reveal>
              
              <Reveal delay={350}>
                <div className="rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
                  <p className="text-3xl font-extrabold text-white">{departments.length - 1}</p>
                  <p className="mt-1 text-sm text-slate-300">Departments</p>
                </div>
              </Reveal>
              
              <Reveal delay={400}>
                <div className="col-span-2 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm sm:col-span-1">
                  <p className="text-3xl font-extrabold text-white">100%</p>
                  <p className="mt-1 text-sm text-slate-300">Remote-Friendly</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Search and Filters */}
        <Reveal>
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
        </Reveal>

        {/* Results Count */}
        <Reveal delay={100}>
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing <span className="font-bold text-[#111A62]">{total}</span> opening
              {total === 1 ? "" : "s"}
            </p>
            {filtered.length !== jobs.length && (
              <p className="text-xs text-slate-500">Filtered from {jobs.length} total</p>
            )}
          </div>
        </Reveal>

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
            {pageItems.map((job, index) => (
              <Reveal key={job.id} delay={index * 80}>
                <Card 
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
                        {job.department?.department_name ?? job.department?.name ?? "N/A"}
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
              </Reveal>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Reveal delay={100}>
          <div className="mt-12">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </Reveal>
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

      {/* Apply Modal - Slide-in Panel */}
      {selectedJob && (
        <ApplyModal
          open={showApplyModal}
          job={selectedJob}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </div>
  );
}

