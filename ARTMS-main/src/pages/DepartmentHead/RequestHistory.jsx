import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import manpowerService from "../../services/manpowerService";

const URGENCY_TONE = {
  low:      "default",
  medium:   "info",
  high:     "warning",
  critical: "danger",
};

// Capitalise first letter so StatusChip can match its map
const cap = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

// Format ISO date to readable string
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
};

export default function RequestHistory() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Pagination state — driven by Laravel meta
  const [page,      setPage]      = useState(1);
  const [lastPage,  setLastPage]  = useState(1);
  const [total,     setTotal]     = useState(0);
  const pageSize = 8;

  // Client-side search query
  const [q, setQ] = useState("");

  const fetchRequests = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await manpowerService.getAll({ page: pageNum, per_page: pageSize });
      const { data, current_page, last_page, total: tot } = res.data;
      setRows(data ?? []);
      setPage(current_page ?? pageNum);
      setLastPage(last_page ?? 1);
      setTotal(tot ?? 0);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "Failed to load requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const handlePageChange = (newPage) => {
    fetchRequests(newPage);
  };

  // Client-side filter on the current page
  const filtered = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      String(r.id).toLowerCase().includes(query) ||
      (r.position_needed  ?? "").toLowerCase().includes(query) ||
      (r.status           ?? "").toLowerCase().includes(query) ||
      (r.urgency          ?? "").toLowerCase().includes(query) ||
      (r.department?.department_name ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Page heading */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Requests
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Request History & Status
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          All manpower requisitions submitted by your department.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              All Requests
              {total > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                  {total}
                </span>
              )}
            </CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar
                value={q}
                onChange={(v) => setQ(v)}
                placeholder="Search position, status, urgency…"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Error state */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="py-16 text-center">
              <p className="text-sm font-semibold text-slate-500">No requests found.</p>
              <p className="mt-1 text-xs text-slate-400">
                {q ? "Try a different search term." : "Submit your first manpower request to see it here."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>ID</TH>
                    <TH>Department</TH>
                    <TH>Position</TH>
                    <TH>Headcount</TH>
                    <TH>Urgency</TH>
                    <TH>Status</TH>
                    <TH>Date Needed</TH>
                    <TH className="text-right">Submitted</TH>
                  </tr>
                </THead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <TD className="font-semibold text-slate-900">
                        #{r.id}
                      </TD>
                      <TD>{r.department?.department_name ?? "—"}</TD>
                      <TD className="max-w-[180px] truncate">{r.position_needed}</TD>
                      <TD className="text-center">{r.headcount}</TD>
                      <TD>
                        <Badge tone={URGENCY_TONE[r.urgency] ?? "default"}>
                          {cap(r.urgency)}
                        </Badge>
                      </TD>
                      <TD>
                        <StatusChip status={cap(r.status)} />
                      </TD>
                      <TD>{fmt(r.needed_by)}</TD>
                      <TD className="text-right">{fmt(r.created_at)}</TD>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="mt-4">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
