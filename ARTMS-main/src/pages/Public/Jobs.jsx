import { useEffect, useMemo, useState } from "react";
import { 
  MapPin, Briefcase, Filter, Search, Clock, ChevronDown, ChevronUp
} from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import AlertModal from "../../components/ui/AlertModal";
import { JobDetailsModal } from "../../modals";
import ApplyModal from "../../modals/ApplyModal";
import Reveal from "../../components/ui/Reavel";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [page, setPage] = useState(1);
  const [alertModal, setAlertModal] = useState({ open: false, variant: "info", title: "", message: "" });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState(null); // which card is expanded inline
  const [expandedJobData, setExpandedJobData] = useState(null); // fetched job for the inline form
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
    // Toggle off if already expanded
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      setExpandedJobData(null);
      return;
    }
    setShowDetailsModal(false);
    try {
      const response = await axios.get(`${API_URL}/public/job-postings/${jobId}`);
      const jobData = response.data.posting || response.data;
      setExpandedJobData(jobData);
      setExpandedJobId(jobId);
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

  const handleCollapseForm = () => {
    setExpandedJobId(null);
    setExpandedJobData(null);
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
      <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#060F5A]"></div>
            <p className="text-sm font-medium" style={{ color: "#64748B" }}>Loading job openings...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      {/* ── HERO — photo + navy wash + grid, identical to Home/ApplicationGuide */}
      <section className="relative isolate overflow-hidden px-6 pt-28 pb-20 lg:px-10">
        {/* Background photo with navy wash */}
        <div
          className="absolute inset-0 -z-20 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2000&auto=format&fit=crop)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(135deg, rgba(6,15,90,0.96) 0%, rgba(11,27,120,0.90) 50%, rgba(6,15,90,0.84) 100%)" }}
          aria-hidden="true"
        />
        {/* 24px grid overlay masked to radial — same as Home hero */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
          }}
          aria-hidden="true"
        />
        {/* Floating glow orbs */}
        <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: "rgba(249,115,22,0.08)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: "rgba(99,102,241,0.10)" }} aria-hidden="true" />
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

      {/* ── MAIN LISTING — floating blobs + dot-grid, same as ApplicationGuide steps */}
      <section className="relative isolate overflow-hidden px-6 py-12 lg:px-10">
        {/* Faint orange dot grid */}
        <div className="pointer-events-none absolute inset-0 -z-10" style={{
          backgroundImage: "radial-gradient(circle, #F97316 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.025,
        }} aria-hidden="true" />
        {/* Slow-floating blobs */}
        <div className="pointer-events-none absolute -left-20 top-32 -z-10 h-80 w-80 rounded-full opacity-[0.04] blur-3xl" style={{ backgroundColor: "#060F5A", animation: "float-blob-a 22s ease-in-out infinite" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-64 -z-10 h-64 w-64 rounded-full opacity-[0.05] blur-3xl" style={{ backgroundColor: "#F97316", animation: "float-blob-b 28s ease-in-out infinite" }} aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-20 left-1/3 -z-10 h-72 w-72 rounded-full opacity-[0.035] blur-3xl" style={{ backgroundColor: "#0B1B78", animation: "float-blob-a 35s ease-in-out infinite reverse" }} aria-hidden="true" />
        <style>{`
          @keyframes float-blob-a { 0%,100%{transform:translate(0,0)} 33%{transform:translate(24px,-24px)} 66%{transform:translate(-16px,20px)} }
          @keyframes float-blob-b { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-32px,24px)} 66%{transform:translate(24px,-16px)} }
        `}</style>
        <div className="mx-auto max-w-7xl">
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
            <div className="search-pulse-border group mb-4 flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
              <Search className="h-5 w-5 text-slate-400 transition-colors duration-200 group-hover:text-[#F97316] group-focus-within:text-[#F97316]" />
              <input
                type="text"
                placeholder="Search by job title, keyword, or skills..."
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                className="flex-1 border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none focus:shadow-none"
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
          <div className="mt-6 space-y-4">
            {pageItems.map((job, index) => {
              const isExpanded = expandedJobId === job.id;
              return (
                <Reveal key={job.id} delay={index * 60}>
                  <div className={`overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                    isExpanded
                      ? "border-[#111A62] shadow-xl shadow-[#111A62]/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }`}>

                    {/* ── Card Header (always visible) ─────────────── */}
                    <div className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-4 ${
                      isExpanded ? "bg-white border-b border-slate-100" : "bg-white"
                    }`}>
                      {/* Job Info — full width on mobile, flex-1 on sm+ */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
                            {job.department?.department_name ?? job.department?.name ?? "N/A"}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[#F97316]/10 px-2 py-0.5 text-[10px] font-bold text-[#F97316]">
                            {job.vacancies_count} {job.vacancies_count > 1 ? "Vacancies" : "Vacancy"}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#111A62] leading-snug">
                          {job.job_library?.job_title || "Untitled Position"}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {job.location || "Remote"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                            Full-time
                          </span>
                          {job.closing_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              Apply by {new Date(job.closing_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {!isExpanded && (
                          <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                            {job.description || job.job_library?.job_description || "No description available."}
                          </p>
                        )}
                      </div>

                      {/* Buttons — row on mobile below info, side on sm+ */}
                      <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                        {!isExpanded && (
                          <button
                            onClick={() => handleViewDetails(job.id)}
                            className="flex-1 sm:flex-none sm:w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#111A62] px-3.5 py-2 text-xs font-bold text-[#111A62] hover:bg-[#111A62] hover:text-white transition"
                          >
                            View Details
                          </button>
                        )}
                        <button
                          onClick={() => handleApplyNow(job.id)}
                          className={`flex-1 sm:flex-none sm:w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                            isExpanded
                              ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              : "bg-[#111A62] text-white hover:bg-[#0d1550]"
                          }`}
                        >
                          {isExpanded ? (
                            <><ChevronUp className="h-3.5 w-3.5" /> Collapse</>
                          ) : (
                            <><ChevronDown className="h-3.5 w-3.5" /> Apply Now</>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── Inline Application Form ───────────────────── */}
                    {isExpanded && expandedJobData && (
                      <ApplyModal
                        open={true}
                        job={expandedJobData}
                        onClose={handleCollapseForm}
                      />
                    )}
                  </div>
                </Reveal>
              );
            })}
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
        />
      )}

      {/* Apply Modal is now rendered inline inside each job card — see pageItems.map above */}
    </div>
  );
}

