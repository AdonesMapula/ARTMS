import { useEffect, useState } from "react";
import {
  Briefcase, EyeOff, CheckCircle,
  Plus, X, AlertCircle, Trash2, Filter, RefreshCw, ChevronRight,
  Building2, FileText, Edit
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import TableSkeleton from "../../components/ui/TableSkeleton";
import CardSkeleton from "../../components/ui/CardSkeleton";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ActionLoadingModal from "../../components/ui/ActionLoadingModal";
import JobPostingEditPanel from "../../components/job/JobPostingEditPanel";
import api from "../../services/api";
import jobService from "../../services/jobService";
import { useToast } from "../../context/ToastContext";

const STATUS_TONE = {
  published: "success",
  pending_approval: "warning",
  draft: "info",
  closed: "default",
  cancelled: "danger",
};

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
];

export default function JobPosting() {
  const toast = useToast();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Selected Posting ID for Split View Detail & Edit Panel
  const [selectedPostingId, setSelectedPostingId] = useState(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [alertModal, setAlertModalState] = useState({
    open: false,
    variant: "success",
    title: "",
    message: "",
  });

  const setAlertModal = (modalConfig) => {
    setAlertModalState(modalConfig);
    if (modalConfig?.title) {
      const v = modalConfig.variant === "danger" ? "error" : modalConfig.variant || "info";
      if (typeof toast?.[v] === "function") {
        toast[v](modalConfig.title, modalConfig.message);
      } else if (typeof toast?.showToast === "function") {
        toast.showToast({ title: modalConfig.title, message: modalConfig.message, type: v });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const postingsRes = await api.get("/job-postings");
      setPostings(postingsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosting = async () => {
    const postingId = selectedPosting?.id;
    if (!postingId) return;

    setDeleting(true);
    try {
      await api.delete(`/job-postings/${postingId}`);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: "Job posting was deleted successfully.",
      });
      setDeleteModalOpen(false);
      setSelectedPosting(null);
      if (selectedPostingId === postingId) {
        setSelectedPostingId(null);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== postingId));
      fetchData();
      window.dispatchEvent(new CustomEvent("artms-refresh-sidebar"));
    } catch (error) {
      console.error("Error deleting posting:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to delete job posting.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const uniquePostings = postings.filter((p, index, self) => index === self.findIndex((t) => t.id === p.id));

  const filtered = uniquePostings.filter((p) => {
    const matchesSearch =
      !q ||
      p.job_library?.job_title?.toLowerCase().includes(q.toLowerCase()) ||
      (p.department?.department_name || p.department?.name || "").toLowerCase().includes(q.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "revised" ? p.approval_status === "revised" : p.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    published: postings.filter((p) => p.status === "published").length,
    closed: postings.filter((p) => p.status === "closed").length,
    totalVacancies: postings.reduce((sum, p) => sum + (p.vacancies_count || 1), 0),
    totalApps: postings.reduce((sum, p) => sum + (p.applicants_count || 0), 0),
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await api.post("/job-postings/bulk-delete", { ids: selectedIds });
      setAlertModal({
        open: true,
        variant: "success",
        title: "Bulk Deletion Complete",
        message: res.data?.message || `Successfully deleted ${selectedIds.length} job postings.`,
      });
      if (selectedIds.includes(selectedPostingId)) {
        setSelectedPostingId(null);
      }
      setSelectedIds([]);
      fetchData();
      window.dispatchEvent(new CustomEvent("artms-refresh-sidebar"));
    } catch (err) {
      setAlertModal({
        open: true,
        variant: "error",
        title: "Bulk Deletion Failed",
        message: err.response?.data?.message || "Failed to delete selected job postings.",
      });
    } finally {
      setBulkDeleting(false);
      setBulkDeleteConfirm(false);
    }
  };

  const handleToggleSelectAll = (items) => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((p) => p.id));
    }
  };

  const handleToggleSelectOne = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Title & Stats Container ─────────────────────── */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
              Recruitment
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
              Job Postings Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create job ads from approved PRFs, manage listings, and view candidate applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkDeleting}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold animate-fade-in cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Selected ({selectedIds.length})</span>
              </Button>
            )}
            <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2 bg-white cursor-pointer">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatFilterCard
            title="Total Job Postings"
            value={uniquePostings.length || postings.length}
            icon={<Briefcase size={22} />}
            accentColor="navy"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <StatFilterCard
            title="Published"
            value={stats.published}
            icon={<CheckCircle size={22} />}
            accentColor="emerald"
            active={statusFilter === "published"}
            onClick={() => setStatusFilter("published")}
          />
          <StatFilterCard
            title="Closed"
            value={stats.closed}
            icon={<EyeOff size={22} />}
            accentColor="amber"
            active={statusFilter === "closed"}
            onClick={() => setStatusFilter("closed")}
          />
          <StatFilterCard
            title="Total Vacancies"
            value={stats.totalVacancies}
            icon={<Building2 size={22} />}
            accentColor="indigo"
            active={false}
            onClick={() => setStatusFilter("all")}
          />
        </div>
      </div>


      {/* ── Split-Screen Master-Detail Layout ──────────────────────── */}
      <div className={`grid gap-5 transition-all duration-300 lg:grid-cols-12 ${selectedPostingId ? "h-[calc(100vh-8.5rem)] min-h-[550px]" : ""}`}>

        {/* ── LEFT SIDE: DIRECTORY (Full Table or Sidebar List) ────── */}
        <div className={`transition-all duration-300 ${selectedPostingId ? "lg:col-span-4 h-full min-h-0" : "lg:col-span-12"}`}>

          {selectedPostingId ? (
            /* ── COMPACT SIDEBAR LIST (When Job Panel is open) ──────── */
            <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] p-3.5 shadow-lg space-y-2.5 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Job Postings</h3>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Active Listings</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedPostingId(null)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Expand to Full Table"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="space-y-2 shrink-0">
                <SearchBar
                  value={q}
                  onChange={(val) => { setQ(val); setPage(1); }}
                  placeholder="Search job title..."
                  className="text-xs h-8 rounded-md"
                />

                <Select
                  icon={Filter}
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  buttonClassName="bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 h-8 text-xs rounded-md"
                >
                  {STATUS_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
                {loading ? (
                  <div className="flex flex-col gap-2">
                    <CardSkeleton count={4} className="!grid-cols-1" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No jobs match filter.</div>
                ) : (
                  filtered.map((p) => {
                    const isSelected = p.id === selectedPostingId;
                    const title = p.job_library?.job_title || p.title || "Job Specification";
                    const dept = p.department?.department_name || p.department?.name || "General";

                    const isChecked = selectedIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPostingId(p.id)}
                        className={`p-2.5 rounded-md transition cursor-pointer border ${isSelected
                            ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 shadow-2xs"
                            : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F163D] hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleSelectOne(p.id, e)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-xs border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-0 h-3.5 w-3.5 cursor-pointer shrink-0"
                            />
                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-sm border border-slate-200 dark:border-slate-700">
                              JP-{String(p.id).padStart(3, "0")}
                            </span>
                          </div>
                          <Badge tone={STATUS_TONE[p.status] || "default"} className="text-[9px] px-1.5 py-0.2 capitalize">
                            {p.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <p className={`text-xs font-bold mt-1.5 truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
                          {title}
                        </p>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-medium truncate max-w-[120px]">{dept}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-xs bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.2 font-semibold text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50 text-[9px]">
                              {p.vacancies_count ?? 1} {p.vacancies_count === 1 ? "needed" : "needed"}
                            </span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px]">{p.applicants_count || 0} apps</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ── FULL TABLE DIRECTORY (When no job is open) ─────────── */
            <Card className="animate-fade-in transition-all duration-300">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Briefcase className="text-[#111A62]" size={18} /> Job Postings ({filtered.length})
                    </CardTitle>
                    {selectedIds.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkDeleteConfirm(true)}
                        disabled={bulkDeleting}
                        className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold animate-fade-in cursor-pointer h-8 text-xs"
                      >
                        <Trash2 size={13} />
                        <span>Delete Selected ({selectedIds.length})</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="w-full sm:w-64 flex-1 sm:flex-initial min-w-[200px]">
                      <SearchBar
                        value={q}
                        onChange={(val) => { setQ(val); setPage(1); }}
                        placeholder="Search job title or department..."
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="flex-1 sm:flex-initial min-w-[160px]">
                      <Select
                        icon={Filter}
                        size="md"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        buttonClassName="bg-slate-50 hover:bg-white"
                      >
                        {STATUS_FILTERS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === paginated.length && paginated.length > 0}
                          onChange={() => handleToggleSelectAll(paginated)}
                          className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-4 w-4 cursor-pointer"
                          title="Select all on this page"
                        />
                      </TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Vacancies</TableHead>
                      <TableHead>Applicants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-4">
                          <TableSkeleton rows={10} />
                        </TableCell>
                      </TableRow>
                    ) : paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center">
                          <Briefcase size={48} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">No job postings found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((p) => {
                        const isChecked = selectedIds.includes(p.id);
                        return (
                          <TableRow
                            key={p.id}
                            onClick={() => setSelectedPostingId(p.id)}
                            className={`cursor-pointer transition ${isChecked ? "bg-blue-50/40" : ""}`}
                          >
                            <TableCell className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleToggleSelectOne(p.id, e)}
                                className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-4 w-4 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                                  JP
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {p.job_library?.job_title || p.title || "N/A"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    JP-{String(p.id).padStart(3, "0")}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">{p.department?.department_name || p.department?.name || "General"}</TableCell>
                            <TableCell className="font-bold text-slate-900">{p.vacancies_count}</TableCell>
                            <TableCell>
                              <span className="font-bold text-slate-900">{p.applicants_count || 0}</span>
                              <span className="text-xs text-slate-400"> apps</span>
                            </TableCell>
                            <TableCell>
                              <Badge tone={STATUS_TONE[p.status] ?? "default"}>{p.status?.replace(/_/g, " ")}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPostingId(p.id);
                                  }}
                                  className="flex items-center gap-1 text-xs text-[#111A62] font-bold hover:bg-[#111A62]/10 px-2 py-1 rounded-lg transition cursor-pointer"
                                >
                                  <Edit size={14} /> Edit & View Specs <ChevronRight size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPosting(p);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                                  title="Delete Posting"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {!loading && filtered.length > 10 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={filtered.length}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT SIDE: JOB SPECIFICATION & EDIT PANEL (Smooth Slide In) ── */}
        {selectedPostingId && (
          <div className="lg:col-span-8 animate-slide-up transition-all duration-300 h-full min-h-0">
            <JobPostingEditPanel
              postingId={selectedPostingId}
              initialPosting={postings.find(p => p.id === selectedPostingId)}
              onClose={() => setSelectedPostingId(null)}
              onUpdated={fetchData}
            />
          </div>
        )}
      </div>

      {/* Delete Posting Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Job Posting"
        description={`Are you sure you want to delete job posting JP-${String(selectedPosting?.id || "").padStart(3, "0")}?`}
        confirmText="Delete Posting"
        variant="danger"
        onConfirm={handleDeletePosting}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* Bulk Delete Posting Confirmation Dialog */}
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Delete Selected Job Postings"
        description={`Are you sure you want to delete all ${selectedIds.length} selected job posting(s)? Note: Postings with active applicants will be skipped to protect candidate data.`}
        confirmText={bulkDeleting ? "Deleting..." : "Delete Selected"}
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModalState({ ...alertModal, open: false })}
      />

      {/* Full-screen blocking loading overlay for Deleting Posting */}
      <ActionLoadingModal
        open={deleting}
        type="delete"
        title="Deleting Job Posting..."
        message="Removing job posting and updating listings. Please wait..."
      />
    </div>
  );
}

function StatFilterCard({ title, value, icon, accentColor, active, onClick }) {
  const colorMap = {
    navy: { bg: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/50" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/50" },
    orange: { bg: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/50" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/50" },
    teal: { bg: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-900/50" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border transition-all duration-200 p-3.5 cursor-pointer select-none bg-white dark:bg-[#0F163D] shadow-2xs ${
        active
          ? "border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white"
          : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${theme.bg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{title}</p>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
