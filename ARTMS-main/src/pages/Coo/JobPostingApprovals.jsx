import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Filter, RefreshCw, Briefcase, MapPin, Calendar, User, Building2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import AlertModal from "../../components/ui/AlertModal";
import api from "../../services/api";

const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };
const STATUS_TONE   = { published: "success", pending_approval: "warning", cancelled: "danger", closed: "default" };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—");
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
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

  // Modal
  const [selected, setSelected] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [action,   setAction]   = useState(null);   // "approved" | "rejected"
  const [remarks,  setRemarks]  = useState("");
  const [saving,   setSaving]   = useState(false);

  // Alert
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });
  const showAlert  = (v, t, m) => setAlert({ open: true, variant: v, title: t, message: m });
  const closeAlert = ()        => setAlert((a) => ({ ...a, open: false }));

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

  // ── Client search ───────────────────────────────────────────────────────
  const visible = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      String(r.id).includes(query) ||
      (r.job_library?.job_title ?? "").toLowerCase().includes(query) ||
      (r.department?.name       ?? "").toLowerCase().includes(query)
    );
  });

  // ── Open review ─────────────────────────────────────────────────────────
  const openReview = (row, act) => {
    setSelected(row);
    setAction(act);
    setRemarks("");
    setViewOpen(true);
  };

  // ── Confirm decision ────────────────────────────────────────────────────
  const handleDecision = async () => {
    if (!selected || !action) return;
    setSaving(true);
    try {
      await api.patch(`/job-postings/${selected.id}/approve`, {
        status:  action,      // "approved" | "rejected"
        remarks: remarks.trim() || null,
      });
      setViewOpen(false);
      showAlert(
        action === "approved" ? "success" : "warning",
        action === "approved" ? "Job Posting Approved" : "Job Posting Rejected",
        `JP-${String(selected.id).padStart(3, "0")} — "${selected.job_library?.job_title}" has been ${action}. ${
          action === "approved" ? "It is now live on the public Jobs page." : ""
        }`
      );
      fetchRows(page);
    } catch (err) {
      showAlert("error", "Action Failed", err?.response?.data?.message ?? "Failed to process the request.");
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
            Review and approve job postings created by HR. Approved postings go live immediately on the public Jobs page for applicants to see and apply.
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
              <p className="text-2xl font-extrabold text-slate-900">
                {rows.filter((r) => r.approval_status === "pending").length}
              </p>
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
              <p className="text-2xl font-extrabold text-slate-900">
                {rows.filter((r) => r.approval_status === "approved").length}
              </p>
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
              <SearchBar value={q} onChange={(v) => setQ(v)} placeholder="Search title, dept…" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Postings Cards */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>
            Job Postings ({visible.length} {visible.length === 1 ? "posting" : "postings"})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
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
                {visible.map((r) => (
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
                              JP-{String(r.id).padStart(3, "0")}
                            </Badge>
                            <span className="text-xs text-slate-400">{fmt(r.created_at)}</span>
                          </div>
                          <h3 className="text-lg font-extrabold text-[#111A62]">
                            {r.job_library?.job_title || "Untitled Position"}
                          </h3>
                        </div>
                        <Badge tone={APPROVAL_TONE[r.approval_status] ?? "default"} className="text-xs capitalize">
                          {r.approval_status}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <Building2 size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Department</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {r.department?.name || "—"}
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
                      <div className="mb-4">
                        <Badge tone={STATUS_TONE[r.status] ?? "default"} className="capitalize">
                          {cap(r.status)}
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
                  JP-{String(selected.id).padStart(3, "0")}
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-white">
                  {selected.job_library?.job_title || "Untitled Position"}
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
                <Detail label="Department"  value={selected.department?.name || "—"} />
                <Detail label="Vacancies"   value={selected.vacancies_count} />
                <Detail label="Location"    value={selected.location || "—"} />
                <Detail label="Deadline"    value={fmt(selected.closing_date)} />
                <Detail label="Submitted"   value={fmt(selected.created_at)} />
                <Detail
                  label="Approval"
                  value={
                    <Badge tone={APPROVAL_TONE[selected.approval_status] ?? "default"} className="capitalize">
                      {selected.approval_status}
                    </Badge>
                  }
                />
              </div>

              {/* Job Library details */}
              {selected.job_library && (
                <>
                  {selected.job_library.job_description && (
                    <Section label="Job Description" text={selected.job_library.job_description} />
                  )}
                  {selected.job_library.qualifications && (
                    <Section label="Qualifications" text={selected.job_library.qualifications} />
                  )}
                  {selected.job_library.responsibilities && (
                    <Section label="Responsibilities" text={selected.job_library.responsibilities} />
                  )}
                </>
              )}

              {/* Custom description / requirements from the posting */}
              {selected.description && (
                <Section label="Additional Requirements" text={
                  selected.description.includes("|")
                    ? selected.description.split(" | ").join("\n")
                    : selected.description
                } />
              )}

              {/* Existing remarks */}
              {selected.approval_remarks && (
                <Section label="Previous Remarks" text={selected.approval_remarks} />
              )}

              {/* Action textarea */}
              {action && selected.approval_status === "pending" && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Remarks <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      action === "approved"
                        ? "Add approval notes for HR… (posting will go live immediately)"
                        : "State the reason for rejection…"
                    }
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#111A62] focus:ring-4 focus:ring-[#111A62]/10 resize-none"
                  />
                  {action === "approved" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                      <CheckCircle size={12} />
                      This posting will go live on the public Jobs page immediately after approval.
                    </p>
                  )}
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
                  {saving ? "Publishing…" : "Approve & Publish"}
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
                    <CheckCircle aria-hidden="true" /> Approve &amp; Publish
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
