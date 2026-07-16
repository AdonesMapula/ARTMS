import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiBriefcase, FiFilter } from "react-icons/fi";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { mockJobs } from "../../utils/mockData";

export default function Jobs() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const departments = useMemo(() => {
    const set = new Set(mockJobs.map((j) => j.department));
    return ["all", ...Array.from(set)];
  }, []);

  const types = useMemo(() => {
    const set = new Set(mockJobs.map((j) => j.employmentType));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockJobs.filter((j) => {
      const matchesQuery =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q));
      const matchesDept = dept === "all" || j.department === dept;
      const matchesType = type === "all" || j.employmentType === type;
      return matchesQuery && matchesDept && matchesType;
    });
  }, [query, dept, type]);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

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

        <div className="mt-8 grid gap-3 rounded-2xl border border-[var(--artms-border)] bg-[var(--artms-soft)] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SearchBar value={query} onChange={(v) => { setPage(1); setQuery(v); }} placeholder="Search title, dept, location, tags…" />
          <Select
            value={dept}
            onChange={(e) => { setPage(1); setDept(e.target.value); }}
            label="Department"
            options={departments.map((d) => ({ value: d, label: d === "all" ? "All departments" : d }))}
          />
          <Select
            value={type}
            onChange={(e) => { setPage(1); setType(e.target.value); }}
            label="Employment Type"
            options={types.map((t) => ({ value: t, label: t === "all" ? "All types" : t }))}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                setQuery("");
                setDept("all");
                setType("all");
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
          <Badge tone="info">UI-only placeholder data</Badge>
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
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <FiBriefcase aria-hidden="true" />
                          {job.department}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin aria-hidden="true" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <Badge tone="accent">{job.employmentType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{job.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.tags.map((t) => (
                      <Badge key={t} tone="default" className="bg-slate-100">
                        {t}
                      </Badge>
                    ))}
                  </div>
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

