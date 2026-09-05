import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Filter, RefreshCw, BookOpen, Briefcase, DollarSign, User, Calendar, Clock, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import CardSkeleton from "../../components/ui/CardSkeleton";
import AlertModal from "../../components/ui/AlertModal";
import { JobLibraryApproveModal } from "../../modals";
import JobLibraryViewPanel from "../../components/job/JobLibraryViewPanel";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const APPROVAL_TONE = { approved: "success", pending: "warning", revised: "warning", rejected: "danger" };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—";
const fmtMoney = (v) =>
  v != null ? `₱${Number(v).toLocaleString("en-PH")}` : "—";

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending (All)" },
  { value: "resubmitted", label: "Resubmitted (Revised)" },
  { value: "new_pending", label: "Pending (New)" },
  { value: "revised", label: "Needs Revision (HR)" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];
const PAGE_SIZE = 10;

export default function JobLibraryApprovals() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Modal state
  const [approveModal, setApproveModal] = useState({
    open: false,
    job: null,
    status: "approved",
    remarks: "",
  });
  const [viewModal, setViewModal] = useState({ open: false, job: null });
  const [saving, setSaving] = useState(false);

  // Alert modal & Toast helper
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });
  const showAlert = (variant, title, message) => {
    setAlert({ open: true, variant, title, message });
    toast[variant] ? toast[variant](title, message) : toast.showToast({ title, message, type: variant });
  };
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchRows = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const params = {
          page: pageNum,
          per_page: PAGE_SIZE,
        };
        if (statusFilter !== "all") params.approval_status = statusFilter;
        const res = await api.get("/job-library", { params });
        const { data, current_page, last_page, total: tot } = res.data;
        setRows(data ?? []);
        setPage(current_page ?? pageNum);
        setTotal(tot ?? 0);
      } catch {
        showAlert("error", "Load Failed", "Could not load Job Library entries.");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => { fetchRows(1); }, [fetchRows]);

  // ── Client-side search ──────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      String(r.id).includes(query) ||
      (r.job_title ?? "").toLowerCase().includes(query) ||
      (r.job_category ?? "").toLowerCase().includes(query) ||
      (r.creator?.name ?? "").toLowerCase().includes(query)
    );
  });

  // ── Open review modal ───────────────────────────────────────────────────
  const openReview = (row, act) => {
    setApproveModal({
      open: true,
      job: row,
      status: act,
      remarks: "",
    });
  };

  // ── Submit approve / revise / reject ─────────────────────────────────────────────
  const handleDecision = async () => {
    if (!approveModal.job || !approveModal.status) return;
    if (approveModal.status === "revised" && !approveModal.remarks.trim()) {
      showAlert("error", "Remarks Required", "Please enter revision remarks explaining what HR needs to update.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/job-library/${approveModal.job.id}/approve`, {
        status: approveModal.status,
        remarks: approveModal.remarks.trim() || null,
      });
      const act = approveModal.status;
      const title = act === "approved" ? "Entry Approved" : act === "revised" ? "Marked for Revision" : "Entry Rejected";
      const body = act === "revised"
        ? `Job Library entry "${approveModal.job.job_title}" marked for revision and returned to HR.`
        : `Job Library entry "${approveModal.job.job_title}" has been ${act}.`;
      setApproveModal({ open: false, job: null, status: "approved", remarks: "" });
      showAlert(
        act === "approved" ? "success" : act === "revised" ? "warning" : "error",
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

  // ── Stat counts from current full page (best-effort while paginated) ────
  const pendingCount = rows.filter((r) => r.approval_status === "pending").length;
  const approvedCount = rows.filter((r) => r.approval_status === "approved").length;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("artms-sidebar-count-update", {
        detail: { job_library: pendingCount },
      })
    );
  }, [pendingCount]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Approvals
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Job Library
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve job templates submitted by HR. Approved entries become available in the PRF position dropdown.
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
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Entries"
          value={total}
          icon={<BookOpen size={20} />}
          themeColor="blue"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={<Clock size={20} />}
          themeColor="amber"
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          icon={<CheckCircle size={20} />}
          themeColor="emerald"
        />
        <StatCard
          title="Rejected"
          value={rows.filter((r) => r.approval_status === "rejected").length}
          icon={<XCircle size={20} />}
          themeColor="red"
        />
      </div>

      {/* Filters & Search */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="py-3 px-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              <Filter size={14} />
              <span>Status:</span>
            </div>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${statusFilter === f.value
                      ? "border-[#111A62] bg-[#111A62] text-white shadow-2xs"
                      : "border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-60">
              <SearchBar
                value={q}
                onChange={(v) => setQ(v)}
                placeholder="Search title, category…"
                className="h-8.5 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Entries Cards */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 py-3 px-4 sm:px-5">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Job Entries</span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {loading ? (
            <div className="py-2">
              <CardSkeleton count={6} className="!grid-cols-2 lg:!grid-cols-3" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {q ? "No matching entries found" : "No entries in this category"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q ? "Try a different search term" : "Change the filter to see other entries"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((r) => (
                  <Card
                    key={r.id}
                    onClick={() => {
                      if (r.approval_status === "pending") {
                        setApproveModal({ open: true, job: r, status: "approved", remarks: "" });
                      } else {
                        setViewModal({ open: true, job: r });
                      }
                    }}
                    className="group border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs hover:shadow-sm cursor-pointer flex flex-col h-full rounded-lg overflow-hidden"
                  >
                    <CardContent className="p-4 flex flex-col flex-1 justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge tone="default" className="text-[10px] font-mono px-1.5 py-0.5">
                                JL-{String(r.id).padStart(3, "0")}
                              </Badge>
                              <span className="text-[11px] font-mono text-slate-400">{fmt(r.created_at)}</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#111A62] dark:group-hover:text-blue-400 transition-colors truncate">
                              {r.job_title}
                            </h3>
                          </div>
                          <Badge
                            tone={
                              r.approval_status === "pending" && (r.approval_remarks || r.remarks)
                                ? "info"
                                : APPROVAL_TONE[r.approval_status] ?? "default"
                            }
                            className="text-[10px] px-1.5 py-0.5 shrink-0"
                          >
                            {r.approval_status === "pending" && (r.approval_remarks || r.remarks)
                              ? "Resubmitted"
                              : r.approval_status === "revised"
                                ? "Needs Revision"
                                : r.approval_status.charAt(0).toUpperCase() + r.approval_status.slice(1)}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <Briefcase size={14} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-400 font-medium">Category</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {r.job_category || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <User size={14} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-400 font-medium">Created By</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {r.creator?.name || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <DollarSign size={14} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-400 font-medium">Salary Range</p>
                              <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                                {r.salary_min || r.salary_max
                                  ? `${fmtMoney(r.salary_min)} – ${fmtMoney(r.salary_max)}`
                                  : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <Calendar size={14} className="text-slate-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium">Submitted</p>
                              <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{fmt(r.created_at)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Employment Type */}
                        <div>
                          <Badge tone="accent" className="text-[10px]">
                            {r.employment_type?.replace(/_/g, " ") || "—"}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions Container */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        {r.approval_status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReview(r, "approved");
                            }}
                            className="w-full gap-1.5 border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold h-7.5"
                          >
                            <Eye size={13} />
                            Review Entry & Decide
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewModal({ open: true, job: r });
                            }}
                            className="w-full gap-1.5 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs h-7.5"
                          >
                            <Eye size={13} />
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={(p) => fetchRows(p)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Modals & Panels ── */}
      {viewModal.open && viewModal.job && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
            <JobLibraryViewPanel
              jobId={viewModal.job.id}
              initialJob={viewModal.job}
              onClose={() => setViewModal({ open: false, job: null })}
              onUpdated={fetchRows}
            />
          </div>
        </div>
      )}

      <JobLibraryApproveModal
        open={approveModal.open}
        job={approveModal.job}
        status={approveModal.status}
        remarks={approveModal.remarks}
        onStatusChange={(status) => setApproveModal({ ...approveModal, status })}
        onRemarksChange={(remarks) => setApproveModal({ ...approveModal, remarks })}
        onClose={() => setApproveModal({ open: false, job: null, status: "approved", remarks: "" })}
        onConfirm={handleDecision}
        saving={saving}
      />

      <AlertModal
        isOpen={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
        onConfirm={closeAlert}
      />
    </div>
  );
}

// ── KPI / StatCard Component ──────────────────────────────────────────────────
function StatCard({ title, value, icon, themeColor }) {
  const colorMap = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" },
    red: { bg: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" },
  };
  const theme = colorMap[themeColor] || colorMap.blue;

  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">{value}</p>
      </div>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${theme.bg}`}>
        {icon}
      </div>
    </div>
  );
}
