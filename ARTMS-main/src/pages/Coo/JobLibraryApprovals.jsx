import { useCallback, useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiFilter,
  FiBookOpen,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
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

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];
const PAGE_SIZE = 10;

export default function JobLibraryApprovals() {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [q,            setQ]            = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

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
        if (statusFilter !== "All") params.approval_status = statusFilter.toLowerCase();
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
      {/* Heading */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Approvals
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Job Library
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and approve job templates submitted by HR. Approved entries become
          available in the PRF position dropdown.
        </p>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              Job Entries
              {total > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                  {total}
                </span>
              )}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter pills */}
              <div className="flex items-center gap-1">
                <FiFilter className="text-slate-400 text-xs" aria-hidden="true" />
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setStatusFilter(f); setPage(1); }}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold border transition",
                      statusFilter === f
                        ? "bg-[#111A62] text-white border-[#111A62]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-[#E2E8F0]",
                    ].join(" ")}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="w-full sm:w-56">
                <SearchBar
                  value={q}
                  onChange={(v) => setQ(v)}
                  placeholder="Search title, category…"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FiBookOpen className="mx-auto mb-3 text-3xl text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {q ? "No matching entries found." : "No entries in this category."}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q ? "Try a different search term." : "Change the filter to see other entries."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>ID</TH>
                    <TH>Job Title</TH>
                    <TH>Category</TH>
                    <TH>Employment Type</TH>
                    <TH>Salary Range</TH>
                    <TH>Created By</TH>
                    <TH>Submitted</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <TD className="font-semibold text-slate-900">
                        JL-{String(r.id).padStart(3, "0")}
                      </TD>
                      <TD>
                        <p className="font-semibold text-slate-900">{r.job_title}</p>
                      </TD>
                      <TD className="text-slate-600">{r.job_category || "—"}</TD>
                      <TD>
                        <Badge tone="accent">
                          {r.employment_type?.replace(/_/g, " ") || "—"}
                        </Badge>
                      </TD>
                      <TD className="text-slate-600 text-sm">
                        {r.salary_min || r.salary_max
                          ? `${fmtMoney(r.salary_min)} – ${fmtMoney(r.salary_max)}`
                          : "—"}
                      </TD>
                      <TD className="text-slate-600">{r.creator?.name || "—"}</TD>
                      <TD className="text-slate-500 text-sm">{fmt(r.created_at)}</TD>
                      <TD>
                        <Badge
                          tone={APPROVAL_TONE[r.approval_status] ?? "default"}
                          className="capitalize"
                        >
                          {r.approval_status}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View */}
                          <button
                            title="View details"
                            onClick={() => { setSelected(r); setAction(null); setViewOpen(true); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-[#E2E8F0]"
                          >
                            <FiEye size={14} aria-hidden="true" />
                          </button>

                          {r.approval_status === "pending" && (
                            <>
                              <button
                                title="Approve"
                                onClick={() => openReview(r, "approved")}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 transition hover:bg-green-50"
                              >
                                <FiCheckCircle size={14} aria-hidden="true" />
                              </button>
                              <button
                                title="Reject"
                                onClick={() => openReview(r, "rejected")}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                              >
                                <FiXCircle size={14} aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="mt-4">
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

      {/* ── Detail / Action Modal ──────────────────────────────────────────── */}
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
                  <FiCheckCircle aria-hidden="true" />
                  {saving ? "Approving…" : "Confirm Approval"}
                </button>
              )}

              {action === "rejected" && selected.approval_status === "pending" && (
                <button
                  onClick={handleDecision}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <FiXCircle aria-hidden="true" />
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
                    <FiXCircle aria-hidden="true" /> Reject
                  </button>
                  <button
                    onClick={() => setAction("approved")}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    <FiCheckCircle aria-hidden="true" /> Approve
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
