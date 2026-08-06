import { useCallback, useEffect, useState } from "react";
import { FileText, Clock, CheckCircle, XCircle, Filter, RefreshCw, Eye, Trash2, Edit, AlertTriangle, ChevronRight, X, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import AlertModal from "../../components/ui/AlertModal";
import { ManpowerEditModal } from "../../modals";
import ManpowerViewPanel from "../../components/manpower/ManpowerViewPanel";
import manpowerService from "../../services/manpowerService";
import { useToast } from "../../context/ToastContext";

const URGENCY_TONE = {
  low: "default",
  medium: "info",
  high: "warning",
  critical: "danger"
};

const URGENCY_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
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

  // Selected Request ID for Split View Detail Panel
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 150;
      if (isScrollable && window.scrollY > 100) {
        setIsScrolled(true);
      } else if (window.scrollY < 20) {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      setAlertModal({
        open: true,
        variant: "success",
        title: "Request Deleted",
        message: "Manpower request was permanently deleted.",
      });
      loadRequests();
    } catch (err) {
      setAlertModal({
        open: true,
        variant: "danger",
        title: "Deletion Failed",
        message: err.response?.data?.message || "Failed to delete request.",
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCleanRejected = async () => {
    try {
      const res = await manpowerService.cleanRejected();
      setAlertModal({
        open: true,
        variant: "success",
        title: "Cleanup Complete",
        message: res.data?.message || "All rejected manpower requests have been permanently removed.",
      });
      loadRequests();
    } catch (err) {
      setAlertModal({
        open: true,
        variant: "danger",
        title: "Cleanup Failed",
        message: err.response?.data?.message || "Failed to clean up rejected requests.",
      });
    } finally {
      setCleanConfirm(false);
    }
  };

  const handleSaveEdit = async (formData) => {
    if (!editRequest) return;
    setSavingEdit(true);
    try {
      await manpowerService.update(editRequest.id, formData);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Request Updated & Resubmitted",
        message: "Manpower request updated and sent back to COO for approval.",
      });
      setEditRequest(null);
      loadRequests();
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

  const [sortByUrgency, setSortByUrgency] = useState("critical_first");

  const filtered = requests.filter((r) => {
    if (!q) return true;
    const searchLower = q.toLowerCase();
    const pos = (r.position_needed || r.jobLibrary?.job_title || "").toLowerCase();
    const dept = (r.department?.department_name || r.department?.name || "").toLowerCase();
    const req = (r.requester?.name || r.requested_by || "").toLowerCase();
    const idStr = `prf-${String(r.id).padStart(3, "0")}`;
    return pos.includes(searchLower) || dept.includes(searchLower) || req.includes(searchLower) || idStr.includes(searchLower);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortByUrgency === "critical_first") {
      const weightA = URGENCY_WEIGHT[a.urgency] || 0;
      const weightB = URGENCY_WEIGHT[b.urgency] || 0;
      if (weightB !== weightA) return weightB - weightA;
    } else if (sortByUrgency === "low_first") {
      const weightA = URGENCY_WEIGHT[a.urgency] || 0;
      const weightB = URGENCY_WEIGHT[b.urgency] || 0;
      if (weightB !== weightA) return weightA - weightB;
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const paginated = sorted;
  const paginatedTotal = total || sorted.length;

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    revised: requests.filter((r) => r.status === "revised" || r.status === "needs_revision").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* ── Collapsible Title & Stats Container ─────────────────────── */}
      <div className={`transition-all duration-500 ease-in-out ${isScrolled ? "max-h-0 opacity-0 overflow-hidden pointer-events-none -translate-y-4 space-y-0" : "max-h-[800px] opacity-100 translate-y-0 space-y-6"}`}>
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
              className="gap-2 bg-white"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

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
      </div>

      {/* ── Split-Screen Master-Detail Layout ──────────────────────── */}
      <div className={`grid gap-5 transition-all duration-300 lg:grid-cols-12 ${selectedRequestId ? "h-[calc(100vh-8.5rem)] min-h-[550px]" : ""}`}>

        {/* ── LEFT SIDE: DIRECTORY (Full Table or Sidebar List) ────── */}
        <div className={`transition-all duration-300 ${selectedRequestId ? "lg:col-span-4 h-full min-h-0" : "lg:col-span-12"}`}>

          {selectedRequestId ? (
            /* ── COMPACT SIDEBAR LIST (When Detail panel is open) ───── */
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 animate-fade-in flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Manpower Requisitions</h3>
                  <p className="text-[11px] text-slate-400">Click any request to view specifications</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isScrolled && (
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="rounded-lg border border-[#111A62]/20 bg-[#111A62]/5 px-2 py-1 text-[10px] font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-0.5 cursor-pointer"
                      title="Scroll to top"
                    >
                      ↑ Stats
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedRequestId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    title="Expand to Full Table"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="space-y-2 shrink-0">
                <SearchBar
                  value={q}
                  onChange={handleSearch}
                  placeholder="Search PRF ID or position..."
                  className="text-xs"
                />

                {/* Status Filter */}
                <div>
                  <Select
                    icon={Filter}
                    size="sm"
                    value={statusFilter}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    buttonClassName="bg-slate-50 hover:bg-white"
                  >
                    {STATUS_FILTERS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </Select>
                </div>

                {/* Urgency Sort Dropdown */}
                <div>
                  <Select
                    icon={ArrowUpDown}
                    size="sm"
                    value={sortByUrgency}
                    onChange={(e) => setSortByUrgency(e.target.value)}
                    buttonClassName="bg-slate-50 hover:bg-white"
                  >
                    <option value="critical_first">Urgency: Critical First</option>
                    <option value="low_first">Urgency: Low First</option>
                    <option value="newest">Sort: Newest First</option>
                  </Select>
                </div>

                {/* Color Legend Guide Bar */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-2.5 text-[10px] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span className="uppercase tracking-wider text-[9px] text-[#111A62]">Color Legend Guide</span>
                    <span className="text-[9px] text-slate-400 font-mono">Hover dots for details</span>
                  </div>
                  <div className="space-y-1 font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold text-slate-400 w-12">Urgency:</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Critical</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> High</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Med</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-slate-400 inline-block" /> Low</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold text-slate-400 w-12">Status:</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Approved</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Pending</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> Revision</span>
                      <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Rejected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-10 text-center text-xs text-slate-400">Loading requests...</div>
                ) : sorted.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No requests match filters.</div>
                ) : (
                  sorted.map((r) => {
                    const prfId = `PRF-${String(r.id).padStart(3, "0")}`;
                    const isSelected = r.id === selectedRequestId;
                    const pos = r.position_needed || r.jobLibrary?.job_title || "Unspecified Position";
                    const dept = r.department?.department_name || r.department?.name || "—";

                    const urgencyBg =
                      r.urgency === "critical" ? "bg-red-500" :
                      r.urgency === "high" ? "bg-orange-500" :
                      r.urgency === "medium" ? "bg-blue-500" : "bg-slate-400";

                    const statusBg =
                      r.status === "approved" ? "bg-emerald-500" :
                      r.status === "pending" ? "bg-amber-500" :
                      r.status === "revised" || r.status === "needs_revision" ? "bg-orange-500" : "bg-red-500";

                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRequestId(r.id)}
                        className={`p-3 rounded-2xl transition cursor-pointer border ${
                          isSelected
                            ? "border-[#111A62] bg-[#111A62]/10 ring-2 ring-[#111A62]/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-extrabold text-[#111A62] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {prfId}
                          </span>
                          
                          {/* Color Dot Legend Badge Indicators */}
                          <div className="flex items-center gap-1.5" title={`Urgency: ${r.urgency} | Status: ${r.status}`}>
                            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 border border-slate-200">
                              <span className={`h-2 w-2 rounded-full ${urgencyBg} inline-block`} />
                              <span className="capitalize">{r.urgency}</span>
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 border border-slate-200">
                              <span className={`h-2 w-2 rounded-full ${statusBg} inline-block`} />
                              <span className="capitalize">{r.status === "revised" || r.status === "needs_revision" ? "Revision" : r.status}</span>
                            </span>
                          </div>
                        </div>

                        <p className={`text-xs font-extrabold mt-1.5 truncate ${isSelected ? "text-[#111A62]" : "text-slate-900"}`}>
                          {pos}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                          <span>{dept}</span>
                          <span>Need: {r.headcount} pax</span>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ── FULL TABLE DIRECTORY (When no request is open) ───── */
            <Card className={`animate-fade-in transition-all duration-300 ${isScrolled && !selectedRequestId ? "sticky top-4 z-20 shadow-2xl ring-1 ring-slate-900/10 border-slate-300 bg-white" : ""}`}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="text-[#111A62]" size={18} /> Manpower Requests ({paginatedTotal})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto mt-2 lg:mt-0">
                    <div className="w-full sm:w-60 flex-1 sm:flex-initial min-w-[200px]">
                      <SearchBar
                        value={q}
                        onChange={handleSearch}
                        placeholder="Search requests..."
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="flex-1 sm:flex-initial min-w-[150px]">
                      <Select
                        icon={Filter}
                        size="md"
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        buttonClassName="bg-slate-50 hover:bg-white"
                      >
                        {STATUS_FILTERS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </Select>
                    </div>

                    <div className="flex-1 sm:flex-initial min-w-[190px]">
                      <Select
                        icon={ArrowUpDown}
                        size="md"
                        value={sortByUrgency}
                        onChange={(e) => setSortByUrgency(e.target.value)}
                        buttonClassName="bg-slate-50 hover:bg-white"
                      >
                        <option value="critical_first">Urgency: Critical First</option>
                        <option value="low_first">Urgency: Low First</option>
                        <option value="newest">Sort: Newest First</option>
                      </Select>
                    </div>

                    {isScrolled && !selectedRequestId && (
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="h-10 rounded-xl border border-[#111A62]/20 bg-[#111A62]/5 px-3 py-1.5 text-xs font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Scroll to top"
                      >
                        ↑ Stats
                      </button>
                    )}
                  </div>
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
                          <tr key={r.id} onClick={() => setSelectedRequestId(r.id)} className="hover:bg-slate-50 cursor-pointer">
                            <TD>
                              <div className="font-semibold text-slate-900">
                                PRF-{String(r.id).padStart(3, "0")}
                              </div>
                            </TD>
                            <TD>
                              <div className="font-bold text-slate-900">
                                {r.position_needed || "—"}
                              </div>
                            </TD>
                            <TD className="text-slate-600">{r.department?.department_name || r.department?.name || "—"}</TD>
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
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRequestId(r.id);
                                  }}
                                  className="flex items-center gap-1 text-xs text-[#111A62] font-bold hover:bg-[#111A62]/10 px-2 py-1 rounded-lg transition cursor-pointer"
                                >
                                  <Eye size={14} /> View Details <ChevronRight size={14} />
                                </button>
                                {(r.status === "revised" || r.status === "needs_revision") && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditRequest(r);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                                    title="Edit & Resubmit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                )}
                              </div>
                            </TD>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {paginatedTotal > 10 && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <Pagination
                          page={page}
                          pageSize={pageSize}
                          total={paginatedTotal}
                          onPageChange={setPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT SIDE: MANPOWER SPECIFICATION PANEL (Smooth Slide In) ── */}
        {selectedRequestId && (
          <div className="lg:col-span-8 animate-slide-up transition-all duration-300 h-full min-h-0">
            <ManpowerViewPanel
              requestId={selectedRequestId}
              onClose={() => setSelectedRequestId(null)}
              onUpdated={loadRequests}
            />
          </div>
        )}
      </div>

      {/* Edit Modal for Needs Revision */}
      {editRequest && (
        <ManpowerEditModal
          open={!!editRequest}
          request={editRequest}
          onClose={() => setEditRequest(null)}
          onSave={handleSaveEdit}
          saving={savingEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Manpower Request"
        description={`Are you sure you want to delete request PRF-${String(deleteConfirm?.id || "").padStart(3, "0")}? This action cannot be undone.`}
        confirmText="Delete Request"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Clean Rejected Confirmation Dialog */}
      <ConfirmDialog
        open={cleanConfirm}
        title="Clean Up Rejected Manpower Requests"
        description={`Permanently remove all ${stats.rejected} rejected request(s)? This will clean up clutter from your records.`}
        confirmText="Clean Up Rejected"
        variant="danger"
        onConfirm={handleCleanRejected}
        onCancel={() => setCleanConfirm(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModalState({ ...alertModal, open: false })}
      />
    </div>
  );
}
