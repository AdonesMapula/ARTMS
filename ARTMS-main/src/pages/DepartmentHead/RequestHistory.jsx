import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit,
  ChevronRight,
  X,
  PlusCircle,
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import { ManpowerEditModal } from "../../modals";
import ManpowerViewPanel from "../../components/manpower/ManpowerViewPanel";
import manpowerService from "../../services/manpowerService";
import { useToast } from "../../context/ToastContext";
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

const cap = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function RequestHistory() {
  const toast = useToast();
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Page Heading ────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Department Portal
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            My Request History & Status
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your submitted Personnel Requisition Forms (PRFs), view requested changes from COO/HR, and resubmit revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchRequests(page)}
            disabled={loading}
            className="gap-2 bg-white cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => navigate("/department-head/manpower-request")}
            className="gap-2 bg-[#111A62] text-white hover:bg-[#0d1449] font-bold shadow-md cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Create New PRF</span>
          </Button>
        </div>
      </div>

      {/* ── Summary Stat Cards ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submitted</p>
              <h3 className="text-2xl font-extrabold text-[#111A62] mt-1">{total}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">My Requisitions</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-[#111A62]">
              <FileText size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Under Review</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Pending Approval</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Clock size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Changes Requested</p>
              <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{revisionCount}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Needs Revision</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Ready for Hiring</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Layout: Table with Optional Split View Detail Panel ── */}
      <div className={`grid gap-6 transition-all duration-300 ${selectedRequestId ? "lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Left / Main Table Column */}
        <div className={selectedRequestId ? "lg:col-span-7 space-y-4" : "space-y-4"}>
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="text-[#111A62]" size={18} /> My Requisitions
                  </CardTitle>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="w-full sm:w-56">
                    <SearchBar
                      value={q}
                      onChange={setQ}
                      placeholder="Search position or status..."
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Status Pills Tabs */}
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 overflow-x-auto">
                    {STATUS_TABS.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleStatusTabChange(tab.value)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          statusFilter === tab.value
                            ? "bg-white text-[#111A62] shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={28} className="mx-auto mb-2 animate-spin text-slate-300" />
                  <p className="text-sm font-semibold">Loading your manpower requests...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">No requests found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {q ? "Try adjusting your search query." : "You have not submitted any manpower requests matching this filter."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead>Position Needed</TableHead>
                          <TableHead className="text-center">Headcount</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date Needed</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((r) => {
                          const isSelected = selectedRequestId === r.id;
                          const hasRevision = r.status === "revised" || r.status === "needs_revision";
                          const hasRemarks = !!(r.approval_remarks || r.remarks);

                          return (
                            <TableRow
                              key={r.id}
                              onClick={() => setSelectedRequestId(r.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50/70 border-l-4 border-l-[#111A62]"
                                  : hasRevision
                                  ? "bg-amber-50/30 hover:bg-amber-50/60"
                                  : "hover:bg-slate-50/70"
                              }`}
                            >
                              <TableCell className="font-mono text-xs font-bold text-slate-700">
                                PRF-{String(r.id).padStart(3, "0")}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-extrabold text-[#111A62] text-sm flex items-center gap-1.5">
                                    <span>{r.position_needed}</span>
                                    {hasRevision && (
                                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                                        <AlertTriangle size={10} /> Changes Requested
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Submitted {fmt(r.created_at)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-slate-800">
                                {r.headcount}
                              </TableCell>
                              <TableCell>
                                <Badge tone={URGENCY_TONE[r.urgency] ?? "default"} className="capitalize text-[10px]">
                                  {r.urgency}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge tone={STATUS_TONE[r.status] ?? "default"} className="capitalize text-[10px]">
                                  {hasRevision ? "Needs Revision" : r.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {fmt(r.needed_by)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedRequestId(r.id)}
                                    className="h-7 px-2 text-xs text-slate-600 hover:text-[#111A62] hover:bg-slate-100 cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye size={13} className="mr-1" /> View
                                  </Button>

                                  {hasRevision && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditRequest(r)}
                                      className="h-7 px-2 text-xs text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100 font-bold cursor-pointer gap-1"
                                      title="Edit and Resubmit Changes"
                                    >
                                      <Edit size={12} /> Edit & Resubmit
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

                  <div className="mt-4">
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={(p) => setPage(p)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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
