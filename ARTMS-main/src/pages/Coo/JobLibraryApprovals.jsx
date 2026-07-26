import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Filter, RefreshCw, BookOpen, Briefcase, DollarSign, User, Calendar, Clock, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import AlertModal from "../../components/ui/AlertModal";
import { JobLibraryApproveModal, JobLibraryViewModal } from "../../modals";
import api from "../../services/api";

const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };
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
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];
const PAGE_SIZE = 10;

export default function JobLibraryApprovals() {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [q,            setQ]            = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Modal state
  const [approveModal, setApproveModal] = useState({
    open: false,
    job: null,
    status: "approved",
    remarks: "",
  });
  const [viewModal, setViewModal] = useState({ open: false, job: null });
  const [saving,   setSaving]   = useState(false);

  // Alert modal
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });
  const showAlert  = (variant, title, message) => setAlert({ open: true, variant, title, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchRows = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const params = {
          page:     pageNum,
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
      (r.job_title    ?? "").toLowerCase().includes(query) ||
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

  // ── Submit approve / reject ─────────────────────────────────────────────
  const handleDecision = async () => {
    if (!approveModal.job || !approveModal.status) return;
    setSaving(true);
    try {
      await api.patch(`/job-library/${approveModal.job.id}/approve`, {
        status:  approveModal.status,
        remarks: approveModal.remarks.trim() || null,
      });
      setApproveModal({ open: false, job: null, status: "approved", remarks: "" });
      showAlert(
        approveModal.status === "approved" ? "success" : "warning",
        approveModal.status === "approved" ? "Entry Approved" : "Entry Rejected",
        `Job Library entry "${approveModal.job.job_title}" has been ${approveModal.status}.`
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
  const pendingCount  = rows.filter((r) => r.approval_status === "pending").length;
  const approvedCount = rows.filter((r) => r.approval_status === "approved").length;

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Entries</p>
              <p className="text-2xl font-extrabold text-slate-900">{total}</p>
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
              <p className="text-2xl font-extrabold text-slate-900">{pendingCount}</p>
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
              <p className="text-2xl font-extrabold text-slate-900">{approvedCount}</p>
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
              <p className="text-2xl font-extrabold text-slate-900">
                {rows.filter((r) => r.approval_status === "rejected").length}
              </p>
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
                placeholder="Search title, category…"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Entries Cards */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle>
            Job Entries ({filtered.length} {filtered.length === 1 ? "entry" : "entries"})
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
              <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {q ? "No matching entries found" : "No entries in this category"}
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
                    onClick={() => {
                      if (r.approval_status === "pending") {
                        setApproveModal({ open: true, job: r, status: "approved", remarks: "" });
                      } else {
                        setViewModal({ open: true, job: r });
                      }
                    }}
                    className="group border-slate-200 bg-white transition-all hover:shadow-lg hover:border-blue-300 cursor-pointer"
                  >
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone="default" className="text-xs font-semibold">
                              JL-{String(r.id).padStart(3, "0")}
                            </Badge>
                            <span className="text-xs text-slate-400">{fmt(r.created_at)}</span>
                          </div>
                          <h3 className="text-lg font-extrabold text-[#111A62]">
                            {r.job_title}
                          </h3>
                        </div>
                        <Badge tone={APPROVAL_TONE[r.approval_status] ?? "default"} className="text-xs capitalize">
                          {r.approval_status}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <Briefcase size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Category</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {r.job_category || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <User size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Created By</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {r.creator?.name || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <DollarSign size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Salary Range</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {r.salary_min || r.salary_max
                                ? `${fmtMoney(r.salary_min)} – ${fmtMoney(r.salary_max)}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <Calendar size={16} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Submitted</p>
                            <p className="text-sm font-semibold text-slate-900">{fmt(r.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Employment Type */}
                      <div className="mb-4">
                        <Badge tone="accent">
                          {r.employment_type?.replace(/_/g, " ") || "—"}
                        </Badge>
                      </div>

                      {/* Actions */}
                      {r.approval_status === "pending" ? (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors group-hover:text-blue-500">
                            <MousePointerClick size={14} />
                            <span>Click anywhere on card to review details</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReview(r, "approved");
                              }}
                              className="flex-1 gap-1.5 border-green-200 bg-green-50/50 text-green-600 hover:border-green-300 hover:bg-green-100"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReview(r, "rejected");
                              }}
                              className="flex-1 gap-1.5 border-red-200 bg-red-50/50 text-red-600 hover:border-red-300 hover:bg-red-100"
                            >
                              <XCircle size={14} />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors group-hover:text-blue-500">
                            <MousePointerClick size={14} />
                            <span>Click anywhere on card to view details</span>
                          </div>
                        </div>
                      )}
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
                  onPageChange={(p) => fetchRows(p)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      <JobLibraryViewModal
        open={viewModal.open}
        job={viewModal.job}
        onClose={() => setViewModal({ open: false, job: null })}
      />

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
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />
    </div>
  );
}
