import { useCallback, useEffect, useState } from "react";
import { FileText, Clock, CheckCircle, XCircle, Filter, RefreshCw, Eye, Trash2, Edit, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import AlertModal from "../../components/ui/AlertModal";
import { ManpowerViewModal, ManpowerEditModal } from "../../modals";
import manpowerService from "../../services/manpowerService";
import { useToast } from "../../context/ToastContext";

const URGENCY_TONE = {
  low: "default",
  medium: "info",
  high: "warning",
  critical: "danger"
};

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  revised: "warning",
  needs_revision: "warning",
  rejected: "danger",
};

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "revised", label: "Needs Revision" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminManpowerRequests() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cleanConfirm, setCleanConfirm] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);
  const [editRequest, setEditRequest] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [alertModal, setAlertModalState] = useState({ open: false, variant: "info", title: "", message: "" });

  const setAlertModal = (modalConfig) => {
    setAlertModalState(modalConfig);
    if (modalConfig?.title) {
      const v = modalConfig.variant === "danger" ? "error" : modalConfig.variant || "info";
      toast[v] ? toast[v](modalConfig.title, modalConfig.message) : toast.showToast({ title: modalConfig.title, message: modalConfig.message, type: v });
    }
  };

  const pageSize = 10;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pageSize,
      };
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const res = await manpowerService.getAll(params);
      const data = res.data.data || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
      setTotal(res.data.total || data.length || 0);
    } catch (err) {
      console.error("Failed to load manpower requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, pageSize]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSearch = (value) => {
    setQ(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await manpowerService.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Request Deleted",
        message: "Manpower request has been successfully deleted.",
      });
      loadRequests();
    } catch (err) {
      setDeleteConfirm(null);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Failed to Delete",
        message: err.response?.data?.message || "Failed to delete request.",
      });
    }
  };

  const handleCleanRejected = async () => {
    setCleanConfirm(false);
    try {
      const res = await manpowerService.cleanRejected();
      setAlertModal({
        open: true,
        variant: "success",
        title: "Cleanup Complete",
        message: res.data?.message || "All rejected manpower requests have been cleaned up.",
      });
      loadRequests();
    } catch (err) {
      setAlertModal({
        open: true,
        variant: "error",
        title: "Cleanup Failed",
        message: err.response?.data?.message || "Failed to clean up rejected requests.",
      });
    }
  };

  const handleSaveRevision = async (formData) => {
    if (!editRequest) return;
    setSavingEdit(true);
    try {
      const res = await manpowerService.update(editRequest.id, formData);
      setEditRequest(null);
      setAlertModal({
        open: true,
        variant: "success",
        title: "PRF Resubmitted",
        message: res.data?.message || "Request updated and resubmitted to COO for approval.",
      });
      loadRequests();
    } catch (err) {
      setAlertModal({
        open: true,
        variant: "error",
        title: "Resubmission Failed",
        message: err.response?.data?.message || "Failed to update and resubmit request.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter by search query (client-side)
  const filtered = requests.filter((r) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesSearch =
        r.position_needed?.toLowerCase().includes(s) ||
        r.department?.name?.toLowerCase().includes(s) ||
        r.requester?.name?.toLowerCase().includes(s) ||
        String(r.id).includes(s);
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Pagination
  const paginatedTotal = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginated = filtered.slice(startIdx, endIdx);

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    revised: requests.filter((r) => r.status === "revised" || r.status === "needs_revision").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Requests
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Manpower Request Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review, edit revisions, and manage all department staffing requests
          </p>
        </div>
        <div className="flex gap-2">
          {stats.rejected > 0 && (
            <Button
              variant="outline"
              onClick={() => setCleanConfirm(true)}
              className="gap-1.5 border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
            >
              <Trash2 size={14} />
              <span>Clean Up Rejected ({stats.rejected})</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={loadRequests}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Needs Revision Alert Banner */}
      {stats.revised > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {stats.revised} Manpower Request(s) Marked for Revision by COO
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The COO has returned request(s) with revision notes. Click "Edit & Resubmit" to make changes and send back to COO.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("revised")}
            className="self-start sm:self-center border-amber-400 bg-white text-amber-900 hover:bg-amber-100 font-bold whitespace-nowrap"
          >
            Review Revised PRFs ({stats.revised})
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card
          onClick={() => handleStatusChange("all")}
          className={`cursor-pointer transition-all hover:border-blue-400 ${statusFilter === "all" ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleStatusChange("pending")}
          className={`cursor-pointer transition-all hover:border-amber-400 ${statusFilter === "pending" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20" : ""}`}
        >
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

        <Card
          onClick={() => handleStatusChange("approved")}
          className={`cursor-pointer transition-all hover:border-emerald-400 ${statusFilter === "approved" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20" : ""}`}
        >
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

        <Card
          onClick={() => handleStatusChange("revised")}
          className={`cursor-pointer transition-all hover:border-amber-400 ${statusFilter === "revised" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <RefreshCw size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Needs Revision</p>
              <p className="text-2xl font-extrabold text-amber-600">{stats.revised}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleStatusChange("rejected")}
          className={`cursor-pointer transition-all hover:border-red-400 ${statusFilter === "rejected" ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : ""}`}
        >
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
                  onClick={() => handleStatusChange(f.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === f.value
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
                onChange={handleSearch}
                placeholder="Search requests..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Manpower Requests ({paginatedTotal} {paginatedTotal === 1 ? "request" : "requests"})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No requests found</p>
              <p className="mt-1 text-xs text-slate-400">
                {q || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Manpower requests will appear here"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Request ID</TH>
                    <TH>Position</TH>
                    <TH>Department</TH>
                    <TH>Requested By</TH>
                    <TH>Headcount</TH>
                    <TH>Urgency</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <TD>
                        <div className="font-semibold text-slate-900">
                          PRF-{String(r.id).padStart(3, "0")}
                        </div>
                        {r.needed_by && (
                          <div className="text-xs text-slate-400">
                            Need by: {new Date(r.needed_by).toLocaleDateString()}
                          </div>
                        )}
                      </TD>
                      <TD>
                        <div className="font-medium text-slate-900">
                          {r.position_needed || "—"}
                        </div>
                        {r.jobLibrary?.job_title && r.jobLibrary.job_title !== r.position_needed && (
                          <div className="text-xs text-slate-400">
                            {r.jobLibrary.job_title}
                          </div>
                        )}
                      </TD>
                      <TD className="text-slate-600">{r.department?.name || "—"}</TD>
                      <TD className="text-slate-600">{r.requester?.name || "—"}</TD>
                      <TD className="font-bold text-slate-900">{r.headcount}</TD>
                      <TD>
                        <Badge tone={URGENCY_TONE[r.urgency] ?? "default"} className="capitalize">
                          {r.urgency}
                        </Badge>
                      </TD>
                      <TD>
                        <Badge tone={STATUS_TONE[r.status] ?? "default"} className="capitalize">
                          {r.status === "revised" || r.status === "needs_revision" ? "Needs Revision" : r.status}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* View Details button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewRequest(r);
                            }}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                            title="View Details"
                            aria-label="View request details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit & Resubmit button for Revised requests */}
                          {(r.status === "revised" || r.status === "needs_revision") && (
                            <Button
                              size="sm"
                              onClick={() => setEditRequest(r)}
                              className="h-8 gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 text-xs"
                              title="Edit & Resubmit PRF"
                            >
                              <Edit size={14} />
                              <span>Revise</span>
                            </Button>
                          )}

                          {/* Delete/Remove button - for pending, revised, or rejected */}
                          {["pending", "rejected", "revised", "needs_revision"].includes(r.status) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(r);
                              }}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                              title="Remove Request"
                              aria-label="Remove request"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={paginatedTotal}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <ManpowerViewModal
        open={!!viewRequest}
        request={viewRequest}
        onClose={() => setViewRequest(null)}
      />

      {/* Edit & Resubmit Modal for HR */}
      <ManpowerEditModal
        open={!!editRequest}
        request={editRequest}
        onClose={() => setEditRequest(null)}
        onSave={handleSaveRevision}
        saving={savingEdit}
      />

      {/* Delete Single Request Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove Manpower Request?"
        description={`Are you sure you want to remove PRF-${String(deleteConfirm?.id || 0).padStart(3, "0")} for "${deleteConfirm?.position_needed}"? This action cannot be undone.`}
        confirmLabel="Yes, Remove Request"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(null)}
      />

      {/* Bulk Clean Rejected Confirm Dialog */}
      <ConfirmDialog
        open={cleanConfirm}
        title="Clean Up All Rejected PRFs?"
        description="Are you sure you want to remove all rejected manpower requests from the system? This action cannot be undone."
        confirmLabel="Clean Up All Rejected"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleCleanRejected}
        onClose={() => setCleanConfirm(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
