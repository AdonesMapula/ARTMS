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
import GeometricBackground from "../../components/ui/GeometricBackground";
import axios from "axios";
import { calculateSalaryBreakdown } from "../../utils/salaryUtils";
import { API_BASE_URL as API_URL } from "../../services/api";

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
      <section className="relative isolate overflow-hidden">
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
        {/* 24px grid overlay masked to radial */}
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

        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center px-6 pt-28 pb-16 text-center lg:px-10">
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#F97316]">
              <Search size={13} />
              Career Opportunities
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Discover Your Next{" "}
              <span className="text-[#F97316]">Career Move</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-indigo-100/75 sm:text-lg">
              Explore exciting opportunities across departments. Search, filter, and apply online — no account required.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── QUICK STATS BAR — solid navy, same as ApplicationGuide ── */}
      <div style={{ backgroundColor: "#060F5A" }} className="border-y border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {[
              { val: String(jobs.length), label: "Open Positions" },
              { val: String(departments.length > 1 ? departments.length - 1 : "—"), label: "Departments" },
              { val: "100%", label: "Online — no account" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-5 text-center">
                <p className="text-lg font-extrabold text-white">{s.val}</p>
                <p className="mt-0.5 text-xs text-indigo-100/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LISTING ── */}
      <section className="relative isolate overflow-hidden px-6 pt-10 pb-14 lg:px-10">
        <GeometricBackground variant="isometric" />
        {/* Slow-floating blobs */}
        <div className="pointer-events-none absolute -left-20 top-32 -z-10 h-80 w-80 rounded-full opacity-[0.05] blur-3xl" style={{ backgroundColor: "#060F5A", animation: "float-blob-a 22s ease-in-out infinite" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-64 -z-10 h-64 w-64 rounded-full opacity-[0.06] blur-3xl" style={{ backgroundColor: "#F97316", animation: "float-blob-b 28s ease-in-out infinite" }} aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-20 left-1/3 -z-10 h-72 w-72 rounded-full opacity-[0.04] blur-3xl" style={{ backgroundColor: "#0B1B78", animation: "float-blob-a 35s ease-in-out infinite reverse" }} aria-hidden="true" />
        <style>{`
          @keyframes float-blob-a { 0%,100%{transform:translate(0,0)} 33%{transform:translate(24px,-24px)} 66%{transform:translate(-16px,20px)} }
          @keyframes float-blob-b { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-32px,24px)} 66%{transform:translate(24px,-16px)} }
        `}</style>
        <div className="mx-auto max-w-7xl">
        {/* Search and Filters */}
        <Reveal>
          <div className="rounded-2xl border border-slate-200/60 bg-white/95 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#111A62]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#111A62]">
                Filter & Search
              </h2>
            </div>
            
            {/* Search Bar — smooth transition glow, no abrupt pulse */}
            <div
              className="group mb-4 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm"
              style={{
                borderColor: "#CBD5E1",
                transition: "border-color 300ms ease, box-shadow 300ms ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(249,115,22,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12), 0 4px 12px -4px rgba(249,115,22,0.15)";
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "rgba(249,115,22,0.6)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15), 0 4px 12px -4px rgba(249,115,22,0.20)";
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.contains(document.activeElement)) {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
              onBlur={e => {
                if (!e.currentTarget.contains(document.activeElement)) {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
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
                  <div
                    className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                      isExpanded
                        ? "border-[#111A62] shadow-xl shadow-[#111A62]/10"
                        : "border-slate-200 bg-white hover:-translate-y-1"
                    }`}
                    style={{ borderColor: isExpanded ? "#111A62" : "#E2E8F0" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
                      e.currentTarget.style.boxShadow = "0 16px 40px -16px rgba(6,15,90,0.18)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isExpanded ? "#111A62" : "#E2E8F0";
                      e.currentTarget.style.boxShadow = isExpanded ? "0 12px 32px -10px rgba(6,15,90,0.18)" : "none";
                    }}
                  >
                    {/* Top orange gradient bar on hover */}
                    <div
                      className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 z-10"
                      style={{ background: "linear-gradient(90deg, #F97316, #EA580C)" }}
                      aria-hidden="true"
                    />

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
                        <h3 className="text-base font-extrabold text-[#111A62] leading-snug group-hover:text-[#F97316] transition-colors duration-200">
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
                        {(() => {
                          const jl = job.job_library || {};
                          const bd = calculateSalaryBreakdown(jl.salary_min, jl.salary_max, jl.salary_type);
                          if (!bd) return null;
                          return (
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200/60">
                                ₱ Monthly: {bd.formatted.monthly}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                {bd.formatted.daily}/day
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                {bd.formatted.hourly}/hr
                              </span>
                            </div>
                          );
                        })()}
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

