import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiBriefcase, FiFilter, FiCalendar } from "react-icons/fi";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [page, setPage] = useState(1);
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
      <div className="bg-white">
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <div className="flex h-64 items-center justify-center">
            <p className="text-slate-500">Loading job openings...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
              Job Openings
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Find a role that fits your career goals
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Search and filter available jobs. View details and apply online—no account required.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-[var(--artms-border)] bg-[var(--artms-soft)] p-4 sm:grid-cols-2 lg:grid-cols-3">
          <SearchBar value={query} onChange={(v) => { setPage(1); setQuery(v); }} placeholder="Search title, dept, location…" />
          <Select
            value={dept}
            onChange={(e) => { setPage(1); setDept(e.target.value); }}
            label="Department"
            options={departments.map((d) => ({ value: d, label: d === "all" ? "All departments" : d }))}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                setQuery("");
                setDept("all");
                setPage(1);
              }}
            >
              <FiFilter aria-hidden="true" />
              Reset filters
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <p>
            Showing <span className="font-semibold text-slate-900">{total}</span> opening
            {total === 1 ? "" : "s"}
          </p>
        </div>

        {pageItems.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No matching jobs"
              description="Try broadening your search or resetting filters."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {pageItems.map((job) => (
              <Card key={job.id} className="transition hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{job.job_library?.job_title || "Untitled Position"}</CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <FiBriefcase aria-hidden="true" />
                          {job.department?.name || "N/A"}
                        </span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <FiMapPin aria-hidden="true" />
                            {job.location}
                          </span>
                        )}
                        {job.posting_date && (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <FiCalendar aria-hidden="true" />
                            Posted {new Date(job.posting_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge tone="accent">{job.vacancies_count} {job.vacancies_count > 1 ? "openings" : "opening"}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {job.description || job.job_library?.job_description || "No description available."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button as={Link} to={`/jobs/${job.id}`} variant="primary">
                      View details
                    </Button>
                    <Button as={Link} to={`/apply/${job.id}`} variant="outline">
                      Apply now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </section>
    </div>
  );
}

