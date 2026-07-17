import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiBriefcase, FiFilter, FiCalendar, FiSearch, FiClock } from "react-icons/fi";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import AlertModal from "../../components/ui/AlertModal";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [page, setPage] = useState(1);
  const [alertModal, setAlertModal] = useState({ open: false, variant: "info", title: "", message: "" });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#111A62] via-[#1a2575] to-[#111A62] px-6 py-20 lg:px-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <FiSearch className="text-[#F97316]" />
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
            <FiFilter className="text-[#111A62]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#111A62]">
              Filter & Search
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr,auto,auto]">
            <SearchBar 
              value={query} 
              onChange={(v) => { setPage(1); setQuery(v); }} 
              placeholder="Search by title, department, or location…" 
            />
            <Select
              value={dept}
              onChange={(e) => { setPage(1); setDept(e.target.value); }}
              label="Department"
              options={departments.map((d) => ({ value: d, label: d === "all" ? "All Departments" : d }))}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                className="h-11 w-full border-[#111A62] text-[#111A62] hover:bg-[#111A62] hover:text-white"
                onClick={() => {
                  setQuery("");
                  setDept("all");
                  setPage(1);
                }}
              >
                <FiFilter aria-hidden="true" />
                Reset
              </Button>
            </div>
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

        {/* Job Cards */}
        {pageItems.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No matching jobs found"
              description="Try adjusting your search criteria or reset filters to see all available positions."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {pageItems.map((job) => (
              <Card 
                key={job.id} 
                className="group overflow-hidden border-slate-200 transition-all duration-300 hover:border-[#F97316] hover:shadow-xl hover:shadow-[#F97316]/10 hover:-translate-y-1"
              >
                <CardHeader className="relative">
                  {/* Accent Corner */}
                  <div className="absolute right-0 top-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-[#F97316]/5 transition-transform duration-300 group-hover:translate-x-6 group-hover:-translate-y-6"></div>
                  
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-[#111A62] transition-colors group-hover:text-[#F97316]">
                        {job.job_library?.job_title || "Untitled Position"}
                      </CardTitle>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <FiBriefcase className="text-[#111A62]" aria-hidden="true" />
                          <span className="font-medium">{job.department?.name || "N/A"}</span>
                        </span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <FiMapPin className="text-[#F97316]" aria-hidden="true" />
                            <span>{job.location}</span>
                          </span>
                        )}
                        {job.posting_date && (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <FiCalendar className="text-slate-400" aria-hidden="true" />
                            Posted {new Date(job.posting_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      tone="accent" 
                      className="bg-[#F97316]/10 text-[#F97316] ring-1 ring-[#F97316]/20"
                    >
                      {job.vacancies_count} {job.vacancies_count > 1 ? "openings" : "opening"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {job.description || job.job_library?.job_description || "No description available."}
                  </p>
                  
                  {/* Deadline Badge */}
                  {job.closing_date && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                      <FiClock className="text-slate-500" />
                      <span>
                        Apply by {new Date(job.closing_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button 
                      as={Link} 
                      to={`/jobs/${job.id}`} 
                      variant="primary"
                      className="bg-[#111A62] hover:bg-[#0d1550]"
                    >
                      View Details
                    </Button>
                    <Button 
                      as={Link} 
                      to={`/apply/${job.id}`} 
                      variant="outline"
                      className="border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white"
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
    </div>
  );
}

