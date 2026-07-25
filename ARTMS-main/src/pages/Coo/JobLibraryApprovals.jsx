import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Filter, RefreshCw, BookOpen, Briefcase, DollarSign, User, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import AlertModal from "../../components/ui/AlertModal";
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
  const [selected, setSelected] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [action,   setAction]   = useState(null);   // "approved" | "rejected"
  const [remarks,  setRemarks]  = useState("");
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
    setSelected(row);
    setAction(act);
    setRemarks("");
    setViewOpen(true);
  };

  // ── Submit approve / reject ─────────────────────────────────────────────
  const handleDecision = async () => {
    if (!selected || !action) return;
    setSaving(true);
    try {
      await api.patch(`/job-library/${selected.id}/approve`, {
        status:  action,
        remarks: remarks.trim() || null,
      });
      setViewOpen(false);
      showAlert(
        action === "approved" ? "success" : "warning",
        action === "approved" ? "Entry Approved" : "Entry Rejected",
        `Job Library entry "${selected.job_title}" has been ${action}.`
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
        <CardHeader className="pb-4">
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
                    className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30 transition-all hover:shadow-lg hover:border-blue-300"
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
                        {r.approval_status === "pending" && (
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
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={(p) => fetchRows(p)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail / Action Modal */}
      {viewOpen && selected && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setViewOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-[#111A62] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                  JL-{String(selected.id).padStart(3, "0")}
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-white">
                  {selected.job_title}
                </h3>
              </div>
              <button
                onClick={() => setViewOpen(false)}
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-blue-200 hover:bg-white/10 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[55vh] overflow-y-auto px-6 py-5 space-y-4">
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Category"       value={selected.job_category || "—"} />
                <Detail
                  label="Employment Type"
                  value={selected.employment_type?.replace(/_/g, " ") || "—"}
                />
                <Detail label="Salary Min"     value={fmtMoney(selected.salary_min)} />
                <Detail label="Salary Max"     value={fmtMoney(selected.salary_max)} />
                <Detail label="Created By"     value={selected.creator?.name || "—"} />
                <Detail label="Submitted"      value={fmt(selected.created_at)} />
                <Detail
                  label="Status"
                  value={
                    <Badge
                      tone={APPROVAL_TONE[selected.approval_status] ?? "default"}
                      className="capitalize"
                    >
                      {selected.approval_status}
                    </Badge>
                  }
                />
                {selected.approver && (
                  <Detail label="Reviewed By" value={selected.approver.name} />
                )}
              </div>

              {/* Description */}
              {selected.job_description && (
                <Section label="Job Description" text={selected.job_description} />
              )}

              {/* Qualifications */}
              {selected.qualifications && (
                <Section label="Qualifications" text={selected.qualifications} />
              )}

              {/* Responsibilities */}
              {selected.responsibilities && (
                <Section label="Responsibilities" text={selected.responsibilities} />
              )}

              {/* Existing remarks */}
              {selected.approval_remarks && (
                <Section label="Approval Remarks" text={selected.approval_remarks} />
              )}

              {/* Remarks textarea — only when taking action on a pending entry */}
              {action && selected.approval_status === "pending" && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Remarks{" "}
                    <span className="text-xs font-normal text-slate-400">(optional)</span>
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

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setViewOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#E2E8F0]"
              >
                {action ? "Cancel" : "Close"}
              </button>

              {action === "approved" && selected.approval_status === "pending" && (
                <button
                  onClick={handleDecision}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCircle aria-hidden="true" />
                  {saving ? "Approving…" : "Confirm Approval"}
                </button>
              )}

              {action === "rejected" && selected.approval_status === "pending" && (
                <button
                  onClick={handleDecision}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <XCircle aria-hidden="true" />
                  {saving ? "Rejecting…" : "Confirm Rejection"}
                </button>
              )}

              {/* Quick action buttons when just viewing a pending entry */}
              {!action && selected.approval_status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setAction("rejected")}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <XCircle aria-hidden="true" /> Reject
                  </button>
                  <button
                    onClick={() => setAction("approved")}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    <CheckCircle aria-hidden="true" /> Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

function Section({ label, text }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}
