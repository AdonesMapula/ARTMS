import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Clock, CheckCircle, XCircle, Eye, Filter, RefreshCw, X, User, Building2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";
import AlertModal from "../../components/ui/AlertModal";
import manpowerService from "../../services/manpowerService";

const URGENCY_TONE = { low: "default", medium: "info", high: "warning", critical: "danger" };
const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" };

const cap  = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const fmt  = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function ManpowerApprovals() {
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

  // Alert modal
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });
  const showAlert = (variant, title, message) =>
    setAlert({ open: true, variant, title, message });
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
  }), [total, rows]);

  // ── Open review panel ───────────────────────────────────────────────────
  const openReview = (row, act) => {
    setSelected(row);
    setAction(act);
    setRemarks("");
    setViewOpen(true);
  };

  // ── Submit approve / reject ──────────────────────────────────────────────
  const handleDecision = async () => {
    if (!selected || !action) return;
    setSaving(true);
    try {
      await manpowerService.approve(selected.id, {
        status:  action,
        remarks: remarks.trim() || null,
      });
      setViewOpen(false);
      showAlert(
        action === "approved" ? "success" : "warning",
        action === "approved" ? "Request Approved" : "Request Rejected",
        `PRF #${selected.id} — "${selected.position_needed}" has been ${action}.`
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Requests</p>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
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
                    className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30 transition-all hover:shadow-lg hover:border-blue-300"
                  >
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="mb-4 flex items-start justify-between">
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
                        <Badge tone={STATUS_TONE[r.status] ?? "default"} className="text-xs capitalize">
                          {r.status}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="mb-4 grid grid-cols-2 gap-3">
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
                      <div className="mb-4">
                        <Badge tone={URGENCY_TONE[r.urgency] ?? "default"} className="capitalize">
                          {r.urgency} Priority
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelected(r); setAction(null); setViewOpen(true); }}
                          className="flex-1 gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                        >
                          <Eye size={14} />
                          View
                        </Button>
                        {r.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReview(r, "approved")}
                              className="border-green-200 bg-green-50/50 text-green-600 hover:bg-green-100 hover:border-green-300"
                            >
                              <CheckCircle size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReview(r, "rejected")}
                              className="border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100 hover:border-red-300"
                            >
                              <XCircle size={14} />
                            </Button>
                          </>
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
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={selected ? `PRF-${String(selected.id).padStart(3, "0")}` : ""}
        description={selected?.position_needed || ""}
        className="max-w-2xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setViewOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400"
            >
              <X size={16} />
              {action ? "Cancel" : "Close"}
            </button>

            {action === "approved" && selected?.status === "pending" && (
              <button
                onClick={handleDecision}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-60"
              >
                <CheckCircle size={16} />
                {saving ? "Approving…" : "Confirm Approval"}
              </button>
            )}

            {action === "rejected" && selected?.status === "pending" && (
              <button
                onClick={handleDecision}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-60"
              >
                <XCircle size={16} />
                {saving ? "Rejecting…" : "Confirm Rejection"}
              </button>
            )}

            {!action && selected?.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("rejected")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-transparent px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:border-red-300"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  onClick={() => setAction("approved")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700"
                >
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            )}
          </div>
        }
      >
        {selected && (
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5">
            {/* Details Section */}
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Request Details
              </p>
              <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Detail label="Department" value={selected.department?.name || selected.department?.department_name || "—"} />
                  <Detail label="Requested By" value={selected.requester?.name ?? "—"} />
                  <Detail label="Headcount" value={selected.headcount} />
                  <Detail
                    label="Urgency"
                    value={
                      <Badge tone={URGENCY_TONE[selected.urgency] ?? "default"} className="capitalize">
                        {selected.urgency}
                      </Badge>
                    }
                  />
                  <Detail label="Date Needed" value={fmt(selected.needed_by)} />
                  <Detail label="Submitted" value={fmt(selected.created_at)} />
                  <Detail
                    label="Status"
                    value={
                      <Badge tone={STATUS_TONE[selected.status] ?? "default"} className="capitalize">
                        {selected.status}
                      </Badge>
                    }
                  />
                  {selected.jobLibrary && (
                    <Detail label="Job Library" value={selected.jobLibrary.job_title} />
                  )}
                </div>
              </div>
            </div>

            {/* Justification */}
            {selected.justification && (
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Requirements &amp; Justification
                </p>
                <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selected.justification.split(" | ").map((line, i) => (
                      <span key={i} className="block mb-2 last:mb-0">{line}</span>
                    ))}
                  </p>
                </div>
              </div>
            )}

            {/* Existing Approval Remarks */}
            {selected.approval_remarks && (
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Previous Remarks
                </p>
                <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4">
                  <p className="text-sm text-slate-700">
                    {selected.approval_remarks}
                  </p>
                </div>
              </div>
            )}

            {/* Remarks textarea — only when taking action */}
            {action && selected.status === "pending" && (
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Your Remarks <span className="text-xs font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    action === "approved"
                      ? "Add approval notes for HR…"
                      : "State the reason for rejection…"
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#111A62] focus:ring-4 focus:ring-[#111A62]/10 resize-none"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

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

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-0.5 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}
