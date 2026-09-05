import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Clock, CheckCircle, XCircle, Eye, Filter, RefreshCw, X, User, Building2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import CardSkeleton from "../../components/ui/CardSkeleton";
import { ManpowerApproveModal } from "../../modals";
import AlertModal from "../../components/ui/AlertModal";
import manpowerService from "../../services/manpowerService";
import { useToast } from "../../context/ToastContext";

const URGENCY_TONE = { low: "default", medium: "info", high: "warning", critical: "danger" };
const STATUS_TONE = { pending: "warning", approved: "success", revised: "warning", rejected: "danger" };

const cap  = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const fmt  = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending (All)" },
  { value: "resubmitted", label: "Resubmitted (Revised)" },
  { value: "new_pending", label: "Pending (New)" },
  { value: "revised", label: "Needs Revision (HR)" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function ManpowerApprovals() {
  const toast = useToast();
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [q,         setQ]         = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Detail / action modal
  const [selected,  setSelected]  = useState(null);
  const [viewOpen,  setViewOpen]  = useState(false);
  const [action,    setAction]    = useState(null);   // "approved" | "rejected"
  const [remarks,   setRemarks]   = useState("");
  const [saving,    setSaving]    = useState(false);

  // Alert modal & Toast helper
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });
  const showAlert = (variant, title, message) => {
    setAlert({ open: true, variant, title, message });
    toast[variant] ? toast[variant](title, message) : toast.showToast({ title, message, type: variant });
  };
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  const pageSize = 10;

  const fetchRows = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const params = { page: pageNum, per_page: pageSize };
        if (statusFilter !== "all") params.status = statusFilter;
        const res = await manpowerService.getAll(params);
        const { data, current_page, total: tot } = res.data;
        setRows(data ?? []);
        setPage(current_page ?? pageNum);
        setTotal(tot ?? 0);
      } catch {
        showAlert("error", "Load Failed", "Could not load manpower requests.");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchRows(1);
  }, [fetchRows]);

  const handlePageChange = (p) => fetchRows(p);

  // Client-side search within current page
  const filtered = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      String(r.id).includes(query) ||
      (r.position_needed               ?? "").toLowerCase().includes(query) ||
      (r.department?.name              ?? "").toLowerCase().includes(query) ||
      (r.department?.department_name   ?? "").toLowerCase().includes(query) ||
      (r.requester?.name               ?? "").toLowerCase().includes(query) ||
      (r.urgency                       ?? "").toLowerCase().includes(query)
    );
  });

  // Statistics
  const stats = useMemo(() => ({
    total: total,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    revised: rows.filter((r) => r.status === "revised" || r.status === "needs_revision").length,
  }), [total, rows]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("artms-sidebar-count-update", {
        detail: { manpower_requests: stats.pending },
      })
    );
  }, [stats.pending]);

  // ── Open review panel ───────────────────────────────────────────────────
  const openReview = (row, act) => {
    setSelected(row);
    setAction(act);
    setRemarks("");
    setViewOpen(true);
  };

  // ── Submit approve / revise / reject ──────────────────────────────────────────────
  const handleDecision = async (updatedData = null) => {
    if (!selected || !action) return;
    if (action === "revised" && !remarks.trim()) {
      showAlert("error", "Remarks Required", "Please enter revision remarks explaining what HR needs to update.");
      return;
    }
    setSaving(true);
    try {
      await manpowerService.approve(selected.id, {
        status:  action,
        remarks: remarks.trim() || null,
        qualifications: updatedData?.qualifications,
        responsibilities: updatedData?.responsibilities,
      });
      setViewOpen(false);
      const title = action === "approved" ? "Request Approved" : action === "revised" ? "Marked for Revision" : "Request Rejected";
      const body = action === "revised" 
        ? `PRF #${selected.id} — "${selected.position_needed}" marked for revision and returned to HR.`
        : `PRF #${selected.id} — "${selected.position_needed}" has been ${action}.`;
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
            Personnel Requisition Forms
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve staffing requests from department heads
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
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={<FileText size={20} />}
          themeColor="blue"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock size={20} />}
          themeColor="amber"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={<CheckCircle size={20} />}
          themeColor="emerald"
        />
        <StatCard
          title="Needs Revision"
          value={stats.revised}
          icon={<RefreshCw size={20} />}
          themeColor="amber"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
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
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    statusFilter === f.value
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
                placeholder="Search PRFs..."
                className="h-8.5 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Cards */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 py-3 px-4 sm:px-5">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>PRF Requisitions</span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length} {filtered.length === 1 ? "request" : "requests"}
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
              <FileText size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {q ? "No matching requests found" : "No requests in this category"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q ? "Try adjusting your search" : "Change the filter to see other requests"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((r) => (
                  <Card
                    key={r.id}
                    onClick={() => openReview(r, null)}
                    className="group cursor-pointer rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs hover:shadow-sm flex flex-col h-full overflow-hidden"
                  >
                    <CardContent className="p-4 flex flex-col flex-1 justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge tone="default" className="text-[10px] font-mono px-1.5 py-0.5">
                                PRF-{String(r.id).padStart(3, "0")}
                              </Badge>
                              {r.created_at && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  {fmt(r.created_at)}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#111A62] dark:group-hover:text-blue-400 transition-colors truncate">
                              {r.position_needed}
                            </h3>
                            {r.jobLibrary?.job_title && (
                              <p className="mt-0.5 text-xs text-slate-500 truncate">
                                {r.jobLibrary.job_title}
                              </p>
                            )}
                          </div>
                          <Badge 
                            tone={
                              r.status === "pending" && (r.approval_remarks || r.remarks)
                                ? "info"
                                : STATUS_TONE[r.status] ?? "default"
                            } 
                            className="text-[10px] px-1.5 py-0.5 shrink-0"
                          >
                            {r.status === "pending" && (r.approval_remarks || r.remarks) 
                              ? "Resubmitted" 
                              : r.status === "revised" 
                              ? "Needs Revision"
                              : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <Building2 size={14} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-400 font-medium">Department</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {r.department?.department_name || r.department?.name || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <User size={14} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-400 font-medium">Requested By</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {r.requester?.name ?? "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <FileText size={14} className="text-slate-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium">Headcount</p>
                              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{r.headcount} {r.headcount === 1 ? "seat" : "seats"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2">
                            <Calendar size={14} className="text-slate-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium">Needed By</p>
                              <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{fmt(r.needed_by)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Urgency Badge */}
                        <div className="flex items-center justify-between">
                          <Badge tone={URGENCY_TONE[r.urgency] ?? "default"} className="capitalize text-[10px]">
                            {r.urgency} Priority
                          </Badge>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1 font-medium">
                            <Eye size={11} /> Details
                          </span>
                        </div>
                      </div>

                      {/* Actions Container */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        {r.status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openReview(r, "approved"); }}
                            className="w-full gap-1.5 border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold h-7.5"
                          >
                            <Eye size={13} />
                            Review & Decide
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openReview(r, r.status); }}
                            className="w-full gap-1.5 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs h-7.5"
                          >
                            <Eye size={13} />
                            View Record
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
                  pageSize={pageSize}
                  total={total}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail / Action Modal */}
      <ManpowerApproveModal
        open={viewOpen}
        request={selected}
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
