import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Clock, CheckCircle, XCircle, Eye, Filter, RefreshCw, MapPin, Calendar, User, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import { JobPostingApproveModal } from "../../modals";
import AlertModal from "../../components/ui/AlertModal";
import api from "../../services/api";

const APPROVAL_TONE = { approved: "success", pending: "warning", revised: "warning", rejected: "danger" };
const STATUS_TONE   = { published: "success", pending_approval: "warning", cancelled: "danger", closed: "default" };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—");
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const STATUS_FILTERS = [
  { value: "all",      label: "All Status" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "revised",  label: "Needs Revision" },
  { value: "rejected", label: "Rejected" },
];

const PAGE_SIZE = 10;

export default function JobPostingApprovals() {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [q,            setQ]            = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Detail / action modal
  const [selected, setSelected] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [action,   setAction]   = useState(null);   // "approved" | "rejected"
  const [remarks,  setRemarks]  = useState("");
  const [saving,   setSaving]   = useState(false);

  // Alert modal
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });
  const showAlert  = (variant, title, message) =>
    setAlert({ open: true, variant, title, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchRows = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const params = { page: pageNum, per_page: PAGE_SIZE };
        if (statusFilter !== "all") params.approval_status = statusFilter;
        const res = await api.get("/job-postings", { params });
        setRows(res.data.data ?? []);
        setPage(res.data.current_page ?? pageNum);
        setTotal(res.data.total ?? 0);
      } catch {
        showAlert("error", "Load Failed", "Could not load job postings.");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => { fetchRows(1); }, [fetchRows]);

  const handlePageChange = (p) => fetchRows(p);

  // ── Client-side search ──────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      String(r.id).includes(query) ||
      (r.job_library?.job_title          ?? "").toLowerCase().includes(query) ||
      (r.department?.name                ?? "").toLowerCase().includes(query) ||
      (r.department?.department_name     ?? "").toLowerCase().includes(query) ||
      (r.location                        ?? "").toLowerCase().includes(query)
    );
  });

  // ── Statistics ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total,
    pending:  rows.filter((r) => r.approval_status === "pending").length,
    approved: rows.filter((r) => r.approval_status === "approved").length,
    rejected: rows.filter((r) => r.approval_status === "rejected").length,
  }), [total, rows]);

  // ── Open review panel ───────────────────────────────────────────────────
  const openReview = (row, act) => {
    setSelected(row);
    setAction(act);
    setRemarks("");
    setViewOpen(true);
  };

  // ── Submit approve / revise / reject ─────────────────────────────────────────────
  const handleDecision = async (updatedData = null) => {
    if (!selected || !action) return;
    if (action === "revised" && !remarks.trim()) {
      showAlert("error", "Remarks Required", "Please enter revision remarks explaining what HR needs to update.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/job-postings/${selected.id}/approve`, {
        status:          action,
        remarks:         remarks.trim() || null,
        qualifications:  updatedData?.qualifications,
        responsibilities: updatedData?.responsibilities,
      });
      setViewOpen(false);
      const title = action === "approved" ? "Job Posting Approved" : action === "revised" ? "Marked for Revision" : "Job Posting Rejected";
      const body = action === "revised"
        ? `JP-${String(selected.id).padStart(3, "0")} — "${selected.job_library?.job_title}" marked for revision and sent back to HR.`
        : `JP-${String(selected.id).padStart(3, "0")} — "${selected.job_library?.job_title}" has been ${action}.${
            action === "approved" ? " It is now live on the public Jobs page." : ""
          }`;
      showAlert(
        action === "approved" ? "success" : action === "revised" ? "warning" : "error",
        title,
        body
      );
      fetchRows(page);
    } catch (err) {
      showAlert(
        "error",
        "Action Failed",
        err?.response?.data?.message ?? "Failed to process the request."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Approvals
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Job Postings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve job postings created by HR. Approved postings go live immediately on the public Jobs page.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchRows(page)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Briefcase size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Postings</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Approved</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Rejected</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter size={16} />
              Filters:
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === f.value
                      ? "border-[#111A62] bg-[#111A62] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-64">
              <SearchBar
                value={q}
                onChange={(v) => setQ(v)}
                placeholder="Search title, dept, location…"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Postings Cards */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>
            Job Postings ({filtered.length} {filtered.length === 1 ? "posting" : "postings"})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {q ? "No matching postings found" : "No postings in this category"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q ? "Try a different search term" : "Change the filter to see other entries"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((r) => (
                  <Card
                    key={r.id}
                    onClick={() => openReview(r, null)}
                    className="group cursor-pointer border-blue-100 bg-gradient-to-br from-white to-blue-50/30 transition-all hover:shadow-lg hover:border-blue-300 flex flex-col h-full"
                  >
                    <CardContent className="p-5 flex flex-col flex-1 justify-between">
                      <div className="flex-1 space-y-4">
                        {/* Hover hint */}
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="flex items-center gap-1.5">
                            <Eye size={12} />
                            Click to review details
                          </span>
                        </div>

                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge tone="default" className="text-xs font-semibold">
                                JP-{String(r.id).padStart(3, "0")}
                              </Badge>
                              {r.created_at && (
                                <span className="text-xs text-slate-400">
                                  {fmt(r.created_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 items-start">
                              <h3 className="text-lg font-extrabold text-[#111A62]">
                                {r.job_library?.job_title || "Untitled Position"}
                              </h3>
                              {r.is_modified_from_prf && (
                                <Badge tone="warning" className="text-[10px] uppercase tracking-wider">
                                  Modified by HR
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge tone={APPROVAL_TONE[r.approval_status] ?? "default"} className="text-xs capitalize">
                            {r.approval_status}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <Building2 size={16} className="text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500">Department</p>
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {r.department?.name || r.department?.department_name || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <MapPin size={16} className="text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500">Location</p>
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {r.location || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <User size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500">Vacancies</p>
                              <p className="text-sm font-extrabold text-slate-900">{r.vacancies_count}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <Calendar size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500">Deadline</p>
                              <p className="text-sm font-semibold text-slate-900">{fmt(r.closing_date)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <Badge tone={STATUS_TONE[r.status] ?? "default"} className="capitalize">
                            {cap(r.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions Container - Pushed to Bottom */}
                      <div className="mt-4 pt-3 border-t border-slate-100/80">
                        {r.approval_status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openReview(r, "approved"); }}
                            className="w-full gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-bold"
                          >
                            <Eye size={14} />
                            Review Posting & Decide
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openReview(r, r.approval_status); }}
                            className="w-full gap-1.5 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          >
                            <Eye size={14} />
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail / Action Modal */}
      <JobPostingApproveModal
        open={viewOpen}
        posting={selected}
        status={action}
        remarks={remarks}
        onStatusChange={setAction}
        onRemarksChange={setRemarks}
        onClose={() => setViewOpen(false)}
        onConfirm={handleDecision}
        saving={saving}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />
    </div>
  );
}
