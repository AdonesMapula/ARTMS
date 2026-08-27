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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={<FileText size={24} />}
          themeColor="blue"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock size={24} />}
          themeColor="amber"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={<CheckCircle size={24} />}
          themeColor="emerald"
        />
        <StatCard
          title="Needs Revision"
          value={stats.revised}
          icon={<RefreshCw size={24} />}
          themeColor="amber"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={<XCircle size={24} />}
          themeColor="red"
        />
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
                placeholder="Search PRFs..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Cards */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>
            PRF Requests ({filtered.length} {filtered.length === 1 ? "request" : "requests"})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="py-2">
              <CardSkeleton count={6} className="!grid-cols-2 lg:!grid-cols-3" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {q ? "No matching requests found" : "No requests in this category"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q ? "Try adjusting your search" : "Change the filter to see other requests"}
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
                                PRF-{String(r.id).padStart(3, "0")}
                              </Badge>
                              {r.created_at && (
                                <span className="text-xs text-slate-400">
                                  {fmt(r.created_at)}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-extrabold text-[#111A62]">
                              {r.position_needed}
                            </h3>
                            {r.jobLibrary?.job_title && (
                              <p className="mt-1 text-xs text-slate-500 truncate">
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
                            className="text-xs font-semibold"
                          >
                            {r.status === "pending" && (r.approval_remarks || r.remarks) 
                              ? "Resubmitted (Revised)" 
                              : r.status === "revised" 
                              ? "Needs Revision (HR)"
                              : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <Building2 size={16} className="text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500">Department</p>
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {r.department?.department_name || r.department?.name || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <User size={16} className="text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500">Requested By</p>
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {r.requester?.name ?? "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <FileText size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500">Headcount</p>
                              <p className="text-sm font-extrabold text-slate-900">{r.headcount}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <Calendar size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500">Needed By</p>
                              <p className="text-sm font-semibold text-slate-900">{fmt(r.needed_by)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Urgency Badge */}
                        <div>
                          <Badge tone={URGENCY_TONE[r.urgency] ?? "default"} className="capitalize">
                            {r.urgency} Priority
                          </Badge>
                        </div>
                      </div>

                      {/* Actions Container - Pushed to Bottom */}
                      <div className="mt-4 pt-3 border-t border-slate-100/80">
                        {r.status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openReview(r, "approved"); }}
                            className="w-full gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-bold"
                          >
                            <Eye size={14} />
                            Review Request & Decide
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openReview(r, r.status); }}
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
    blue: { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-600 dark:text-blue-400" },
    amber: { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-600 dark:text-amber-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-600 dark:text-emerald-400" },
    red: { bg: "bg-red-100 dark:bg-red-950/60", text: "text-red-600 dark:text-red-400" },
  };
  const theme = colorMap[themeColor] || colorMap.blue;

  return (
    <div className="group relative rounded-xl h-full p-[1.5px] transition-all duration-300 bg-slate-200 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-[#111A62] hover:to-[#E15B1D] hover:shadow-lg hover:shadow-[#111A62]/10">
      <Card className="h-full rounded-[10px] border-0 bg-white dark:bg-[#0F163D] flex flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{title}</p>
            <p className="text-3xl font-black tracking-tight text-[#111A62]">{value}</p>
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${theme.bg}`}>
            <div className={theme.text}>
              {icon}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
