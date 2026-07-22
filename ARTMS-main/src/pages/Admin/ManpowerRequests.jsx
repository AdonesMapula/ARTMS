import { useCallback, useEffect, useState } from "react";
import { FileText, Clock, CheckCircle, XCircle, Filter, RefreshCw, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import manpowerService from "../../services/manpowerService";

const URGENCY_TONE = { 
  low: "default", 
  medium: "info", 
  high: "warning", 
  critical: "danger" 
};

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminManpowerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete request.");
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
            Review and manage all department staffing requests
          </p>
        </div>
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
                  onClick={() => handleStatusChange(f.value)}
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
                          {r.status}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-1.5">
                          {/* View Details button */}
                          <button
                            onClick={() => {
                              // TODO: Implement view details modal
                              alert(`View details for PRF-${String(r.id).padStart(3, "0")}`);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Delete button - only for pending */}
                          {r.status === "pending" && (
                            <button
                              onClick={() => setDeleteConfirm(r)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              title="Delete Request"
                            >
                              <Trash2 size={16} />
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

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Manpower Request?"
        description={`Are you sure you want to delete PRF-${String(deleteConfirm?.id || 0).padStart(3, "0")} for "${deleteConfirm?.position_needed}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
