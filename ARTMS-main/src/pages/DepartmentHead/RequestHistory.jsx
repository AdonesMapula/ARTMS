import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit,
  PlusCircle,
} from "lucide-react";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import { ManpowerEditModal } from "../../modals";
import ManpowerViewPanel from "../../components/manpower/ManpowerViewPanel";
import manpowerService from "../../services/manpowerService";
import { useNavigate } from "react-router-dom";

const URGENCY_TONE = {
  low: "default",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  revised: "warning",
  needs_revision: "warning",
  rejected: "danger",
};

const STATUS_TABS = [
  { value: "all", label: "All My Requests" },
  { value: "pending", label: "Pending" },
  { value: "revised", label: "Needs Revision" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function RequestHistory() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 8;

  // Search & Filter
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection for View & Edit
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [editRequest, setEditRequest] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Alert Modal
  const [alertModal, setAlertModal] = useState({ open: false, variant: "info", title: "", message: "" });

  const fetchRequests = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = {
          page: pageNum,
          per_page: pageSize,
        };
        if (statusFilter && statusFilter !== "all") {
          params.status = statusFilter;
        }

        const res = await manpowerService.getAll(params);
        const { data, current_page, total: tot } = res.data;
        setRows(data ?? []);
        setPage(current_page ?? pageNum);
        setTotal(tot ?? 0);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to load requests. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, pageSize]
  );

  useEffect(() => {
    fetchRequests(page);
  }, [fetchRequests, page]);

  const handleStatusTabChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleEditSave = async (updatedData) => {
    if (!editRequest) return;
    setSavingEdit(true);
    try {
      await manpowerService.update(editRequest.id, updatedData);
      setAlertModal({
        open: true,
        variant: "success",
        title: "PRF Resubmitted",
        message: "Manpower request changes have been saved and resubmitted for review.",
      });
      setEditRequest(null);
      fetchRequests(page);
      if (selectedRequestId === editRequest.id) {
        setSelectedRequestId(editRequest.id);
      }
    } catch (err) {
      setAlertModal({
        open: true,
        variant: "danger",
        title: "Update Failed",
        message: err.response?.data?.message || "Failed to update manpower request.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Client-side search filter
  const filtered = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      String(r.id).toLowerCase().includes(query) ||
      (r.position_needed ?? "").toLowerCase().includes(query) ||
      (r.status ?? "").toLowerCase().includes(query) ||
      (r.urgency ?? "").toLowerCase().includes(query) ||
      (r.department?.department_name ?? "").toLowerCase().includes(query)
    );
  });

  // Calculate summary counts
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const revisionCount = rows.filter((r) => r.status === "revised" || r.status === "needs_revision").length;
  const approvedCount = rows.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* ── Page Heading ────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileText size={12} className="text-amber-500" /> Department Requisitions
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            My Request History & Status
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track submitted PRFs, review feedback from COO and HR, and resubmit requested adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchRequests(page)}
            disabled={loading}
            className="gap-1.5 rounded-md text-xs py-1.5 px-3 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-amber-500" : ""} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => navigate("/department-head/manpower-request")}
            className="gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-semibold py-1.5 px-3 shadow-sm text-white cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Create New PRF</span>
          </Button>
        </div>
      </div>

      {/* ── Summary Stat Cards ────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Submitted</p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">{total}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">All PRF records</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
            <FileText size={16} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Under Review</p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Awaiting COO sign-off</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
            <Clock size={16} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Changes Requested</p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-0.5">{revisionCount}</h3>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-500 mt-0.5">Requires update</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
            <AlertTriangle size={16} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Approved</p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">{approvedCount}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">In recruitment pipeline</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
            <CheckCircle size={16} />
          </div>
        </div>
      </div>

      {/* ── Main Layout: Table with Optional Split View Detail Panel ── */}
      <div className={`grid gap-4 transition-all duration-300 ${selectedRequestId ? "lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Left / Main Table Column */}
        <div className={selectedRequestId ? "lg:col-span-7 space-y-3" : "space-y-3"}>
          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-600 dark:text-blue-400" size={15} />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Requisitions Directory
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="w-full sm:w-52">
                  <SearchBar
                    value={q}
                    onChange={setQ}
                    placeholder="Search PRF ID, position..."
                    className="h-8 text-xs"
                  />
                </div>

                {/* Status Pills Tabs */}
                <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700 overflow-x-auto">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => handleStatusTabChange(tab.value)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all whitespace-nowrap cursor-pointer ${
                        statusFilter === tab.value
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold">Loading manpower requests...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <FileText size={30} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No requests found</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {q ? "No matching records found for query." : "No requisitions recorded in this filter."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border border-slate-200/80 dark:border-slate-800">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                      <TableRow className="border-b border-slate-200/80 dark:border-slate-800">
                        <TableHead className="w-16 py-2 px-3">ID</TableHead>
                        <TableHead className="py-2 px-3">Position Needed</TableHead>
                        <TableHead className="text-center py-2 px-2">Headcount</TableHead>
                        <TableHead className="py-2 px-3">Urgency</TableHead>
                        <TableHead className="py-2 px-3">Status</TableHead>
                        <TableHead className="py-2 px-3">Date Needed</TableHead>
                        <TableHead className="text-right py-2 px-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => {
                        const isSelected = selectedRequestId === r.id;
                        const hasRevision = r.status === "revised" || r.status === "needs_revision";

                        return (
                          <TableRow
                            key={r.id}
                            onClick={() => setSelectedRequestId(r.id)}
                            className={`cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/60 ${
                              isSelected
                                ? "bg-blue-50/70 dark:bg-blue-950/30 border-l-2 border-l-blue-600"
                                : hasRevision
                                ? "bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/40"
                                : "hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <TableCell className="py-2.5 px-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              PRF-{String(r.id).padStart(3, "0")}
                            </TableCell>
                            <TableCell className="py-2.5 px-3">
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                  <span>{r.position_needed}</span>
                                  {hasRevision && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-400">
                                      <AlertTriangle size={9} /> Changes Req.
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                  Submitted {fmt(r.created_at)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                              {r.headcount}
                            </TableCell>
                            <TableCell className="py-2.5 px-3">
                              <Badge tone={URGENCY_TONE[r.urgency] ?? "default"} className="capitalize text-[10px] py-0 px-1.5">
                                {r.urgency}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 px-3">
                              <Badge tone={STATUS_TONE[r.status] ?? "default"} className="capitalize text-[10px] py-0 px-1.5">
                                {hasRevision ? "Needs Revision" : r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                              {fmt(r.needed_by)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedRequestId(r.id)}
                                  className="h-6 px-2 text-[11px] text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye size={12} className="mr-1" /> View
                                </Button>

                                {hasRevision && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditRequest(r)}
                                    className="h-6 px-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 hover:bg-amber-100 font-bold cursor-pointer gap-1"
                                    title="Edit and Resubmit Changes"
                                  >
                                    <Edit size={11} /> Edit
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-3">
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Split-View Detail Panel (When a request is selected) */}
        {selectedRequestId && (
          <div className="lg:col-span-5 h-full">
            <div className="sticky top-20">
              <ManpowerViewPanel
                requestId={selectedRequestId}
                onClose={() => setSelectedRequestId(null)}
                onEdit={(req) => setEditRequest(req)}
                onUpdated={() => fetchRequests(page)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Edit & Resubmit Modal ─────────────────────────────────── */}
      {editRequest && (
        <ManpowerEditModal
          open={!!editRequest}
          request={editRequest}
          onClose={() => setEditRequest(null)}
          onSave={handleEditSave}
          saving={savingEdit}
        />
      )}

      {/* ── Alert Modal ───────────────────────────────────────────── */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ open: false, variant: "info", title: "", message: "" })}
      />
    </div>
  );
}
