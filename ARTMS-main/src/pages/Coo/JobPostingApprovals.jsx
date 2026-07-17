import { useCallback, useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiFilter,
  FiBriefcase,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import AlertModal from "../../components/ui/AlertModal";
import api from "../../services/api";

const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };
const STATUS_TONE   = { published: "success", pending_approval: "warning", cancelled: "danger", closed: "default" };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—");
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];
const PAGE_SIZE = 10;

export default function JobPostingApprovals() {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [q,            setQ]            = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

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
        if (statusFilter !== "All") params.approval_status = statusFilter.toLowerCase();
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
      {/* Heading */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Approvals
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Job Postings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and approve job postings created by HR. Approved postings go live
          immediately on the public Jobs page for applicants to see and apply.
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              Job Postings
              {total > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                  {total}
                </span>
              )}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
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
                <SearchBar value={q} onChange={(v) => setQ(v)} placeholder="Search title, dept…" />
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
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <FiBriefcase className="mx-auto mb-3 text-3xl text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {q ? "No matching postings found." : "No postings in this category."}
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
                    <TH>Department</TH>
                    <TH>Vacancies</TH>
                    <TH>Location</TH>
                    <TH>Deadline</TH>
                    <TH>Approval</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <TD className="font-semibold text-slate-900">
                        JP-{String(r.id).padStart(3, "0")}
                      </TD>
                      <TD>
                        <p className="font-semibold text-slate-900">
                          {r.job_library?.job_title || "—"}
                        </p>
                      </TD>
                      <TD className="text-slate-600">{r.department?.name || "—"}</TD>
                      <TD className="text-slate-700 font-semibold">{r.vacancies_count}</TD>
                      <TD className="text-slate-600 text-sm">{r.location || "—"}</TD>
                      <TD className="text-slate-500 text-sm">{fmt(r.closing_date)}</TD>
                      <TD>
                        <Badge
                          tone={APPROVAL_TONE[r.approval_status] ?? "default"}
                          className="capitalize"
                        >
                          {r.approval_status}
                        </Badge>
                      </TD>
                      <TD>
                        <Badge
                          tone={STATUS_TONE[r.status] ?? "default"}
                          className="capitalize"
                        >
                          {cap(r.status)}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex items-center gap-1">
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
                      <FiCheckCircle size={12} />
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
                  <FiCheckCircle aria-hidden="true" />
                  {saving ? "Publishing…" : "Approve & Publish"}
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
                    <FiCheckCircle aria-hidden="true" /> Approve &amp; Publish
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
