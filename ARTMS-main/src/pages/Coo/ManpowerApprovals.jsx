import { useCallback, useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiFilter,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import AlertModal from "../../components/ui/AlertModal";
import manpowerService from "../../services/manpowerService";

const URGENCY_TONE = { low: "default", medium: "info", high: "warning", critical: "danger" };
const cap  = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const fmt  = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];

export default function ManpowerApprovals() {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [lastPage,  setLastPage]  = useState(1);
  const [total,     setTotal]     = useState(0);
  const [q,         setQ]         = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

  // Detail / action modal
  const [selected,  setSelected]  = useState(null);   // the row being reviewed
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
        if (statusFilter !== "All") params.status = statusFilter.toLowerCase();
        const res = await manpowerService.getAll(params);
        const { data, current_page, last_page, total: tot } = res.data;
        setRows(data ?? []);
        setPage(current_page ?? pageNum);
        setLastPage(last_page ?? 1);
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
      (r.department?.department_name   ?? "").toLowerCase().includes(query) ||
      (r.requester?.name               ?? "").toLowerCase().includes(query) ||
      (r.urgency                       ?? "").toLowerCase().includes(query)
    );
  });

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
      {/* Heading */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Approvals
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Personnel Requisition Forms
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and approve or reject PRFs submitted by department heads.
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
                  placeholder="Search position, dept…"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FiCheckCircle className="mx-auto mb-3 text-3xl text-green-400" />
              <p className="text-sm font-semibold text-slate-600">
                {q ? "No matching requests found." : "No requests in this category."}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q ? "Try a different search term." : "Change the filter to see other requests."}
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
                    <TH>Requested By</TH>
                    <TH>Headcount</TH>
                    <TH>Urgency</TH>
                    <TH>Date Needed</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <TD className="font-semibold text-slate-900">#{r.id}</TD>
                      <TD>{r.department?.department_name ?? "—"}</TD>
                      <TD className="max-w-[160px] truncate">{r.position_needed}</TD>
                      <TD>{r.requester?.name ?? "—"}</TD>
                      <TD className="text-center">{r.headcount}</TD>
                      <TD>
                        <Badge tone={URGENCY_TONE[r.urgency] ?? "default"}>
                          {cap(r.urgency)}
                        </Badge>
                      </TD>
                      <TD>{fmt(r.needed_by)}</TD>
                      <TD>
                        <StatusChip status={cap(r.status)} />
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View details */}
                          <button
                            title="View details"
                            onClick={() => { setSelected(r); setAction(null); setViewOpen(true); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-[#E2E8F0]"
                          >
                            <FiEye size={14} aria-hidden="true" />
                          </button>

                          {r.status === "pending" && (
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
                  pageSize={pageSize}
                  total={total}
                  onPageChange={handlePageChange}
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
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-[#111A62] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                  PRF #{selected.id}
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-white">
                  {selected.position_needed}
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

            {/* PRF details */}
            <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Department"  value={selected.department?.department_name ?? "—"} />
                <Detail label="Requested by" value={selected.requester?.name ?? "—"} />
                <Detail label="Headcount"   value={selected.headcount} />
                <Detail label="Urgency"
                  value={
                    <Badge tone={URGENCY_TONE[selected.urgency] ?? "default"}>
                      {cap(selected.urgency)}
                    </Badge>
                  }
                />
                <Detail label="Date Needed" value={fmt(selected.needed_by)} />
                <Detail label="Submitted"   value={fmt(selected.created_at)} />
                <Detail label="Status"
                  value={<StatusChip status={cap(selected.status)} />}
                />
              </div>

              {selected.justification && (
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Requirements & Justification
                  </p>
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selected.justification.split(" | ").map((line, i) => (
                      <span key={i} className="block">{line}</span>
                    ))}
                  </p>
                </div>
              )}

              {selected.approval_remarks && (
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Approval Remarks
                  </p>
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {selected.approval_remarks}
                  </p>
                </div>
              )}

              {/* Remarks input — only when taking action */}
              {action && selected.status === "pending" && (
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

              {action === "approved" && selected.status === "pending" && (
                <button
                  onClick={handleDecision}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  <FiCheckCircle aria-hidden="true" />
                  {saving ? "Approving…" : "Confirm Approval"}
                </button>
              )}

              {action === "rejected" && selected.status === "pending" && (
                <button
                  onClick={handleDecision}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <FiXCircle aria-hidden="true" />
                  {saving ? "Rejecting…" : "Confirm Rejection"}
                </button>
              )}

              {/* Quick action buttons when just viewing */}
              {!action && selected.status === "pending" && (
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
