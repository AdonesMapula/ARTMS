import { useEffect, useState } from "react";
import {
  AlertCircle, Plus, Trash2, RefreshCw, FileText, Briefcase, Users, AlertTriangle, Link2Off
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import TableSkeleton from "../../components/ui/TableSkeleton";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import JobPostingCreateModal from "../../modals/JobPostingCreateModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ActionLoadingModal from "../../components/ui/ActionLoadingModal";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function JobRequest() {
  const toast = useToast();
  const [approvedPRFs, setApprovedPRFs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletePRFModalOpen, setDeletePRFModalOpen] = useState(false);
  const [selectedPRF, setSelectedPRF] = useState(null);
  const [prfToDelete, setPrfToDelete] = useState(null);
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
      const prfRes = await api.get("/manpower-requests-approved-for-posting");
      setApprovedPRFs(prfRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (prf) => {
    setSelectedPRF(prf);
    setCreateModalOpen(true);
  };

  const handleCreatePosting = async (submittedFormData) => {
    if (!selectedPRF) return;

    if (!selectedPRF.job_library_id) {
      setAlertModal({
        open: true,
        variant: "error",
        title: "No Job Library Entry Linked",
        message:
          "This PRF was submitted without selecting a position from the Job Library. " +
          "Please ask the Department Head to resubmit the PRF using the updated form.",
      });
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/job-postings", {
        job_library_id: selectedPRF.job_library_id,
        department_id: selectedPRF.department_id,
        manpower_request_id: selectedPRF.id,
        vacancies_count: selectedPRF.headcount,
        location: submittedFormData.location,
        closing_date: submittedFormData.closing_date || null,
        description: submittedFormData.description || null,
        qualifications: submittedFormData.qualifications,
        responsibilities: submittedFormData.responsibilities,
      });

      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: res.data?.message || "Job posting was successfully updated and published.",
      });
      setCreateModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("artms-refresh-sidebar"));
    } catch (error) {
      console.error("Error creating posting:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to create job posting.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePRF = async () => {
    if (!prfToDelete) return;
    try {
      await api.delete(`/manpower-requests/${prfToDelete.id}`);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: "PRF deleted successfully.",
      });
      setDeletePRFModalOpen(false);
      setPrfToDelete(null);
      fetchData();
      window.dispatchEvent(new CustomEvent("artms-refresh-sidebar"));
    } catch (error) {
      console.error("Error deleting PRF:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to delete PRF.",
      });
    }
  };

  const stats = {
    total: approvedPRFs.length,
    totalHeadcount: approvedPRFs.reduce((sum, p) => sum + (p.headcount || 1), 0),
    urgent: approvedPRFs.filter((p) => p.urgency === 'high' || p.urgency === 'critical').length,
    unlinked: approvedPRFs.filter((p) => !p.job_library_id).length,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
              Recruitment
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
              Job Requests Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create job ads from approved PRFs submitted by Department Heads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2 bg-white cursor-pointer">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatFilterCard
            title="Total Approved PRFs"
            value={stats.total}
            icon={<Briefcase size={22} />}
            accentColor="navy"
            active={false}
          />
          <StatFilterCard
            title="Total Headcount Needed"
            value={stats.totalHeadcount}
            icon={<Users size={22} />}
            accentColor="indigo"
            active={false}
          />
          <StatFilterCard
            title="Urgent/Critical PRFs"
            value={stats.urgent}
            icon={<AlertTriangle size={22} />}
            accentColor="amber"
            active={false}
          />
          <StatFilterCard
            title="Unlinked to Job Library"
            value={stats.unlinked}
            icon={<Link2Off size={22} />}
            accentColor="rose"
            active={false}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#111A62]">Approved PRFs — Ready for Job Posting ({approvedPRFs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : approvedPRFs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No Approved PRFs found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Job Library</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Headcount</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedPRFs.map((prf) => (
                  <TableRow key={prf.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{prf.position_needed}</p>
                        <p className="text-xs text-slate-400">
                          PRF-{String(prf.id).padStart(3, "0")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {prf.job_library_id ? (
                        <div className="flex items-center gap-1.5">
                          <FileText size={12} className="text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">
                            {prf.jobLibrary?.job_title || `JL-${String(prf.job_library_id).padStart(3, "0")}`}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle size={11} /> Not linked
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">{prf.department?.department_name || prf.department?.name}</TableCell>
                    <TableCell className="font-bold text-slate-900">{prf.headcount}</TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          prf.urgency === "critical"
                            ? "danger"
                            : prf.urgency === "high"
                              ? "warning"
                              : "info"
                        }
                      >
                        {prf.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{prf.approver?.name || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openCreateModal(prf)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                          title="Create Job Posting"
                        >
                          <Plus size={14} />
                          Create Posting
                        </button>
                        <button
                          onClick={() => {
                            setPrfToDelete(prf);
                            setDeletePRFModalOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="Delete PRF"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deletePRFModalOpen}
        title="Delete Approved PRF"
        description={`Are you sure you want to delete PRF-${String(prfToDelete?.id || "").padStart(3, "0")}?`}
        confirmText="Delete PRF"
        variant="danger"
        onConfirm={handleDeletePRF}
        onCancel={() => setDeletePRFModalOpen(false)}
      />

      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModalState({ ...alertModal, open: false })}
      />

      {/* Create Job Posting Modal */}
      <JobPostingCreateModal
        open={createModalOpen}
        prf={selectedPRF}
        existingPostings={[]}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreatePosting}
        saving={creating}
      />
    </div>
  );
}

function StatFilterCard({ title, value, icon, accentColor, active, onClick }) {
  const colorMap = {
    navy: { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-600 dark:text-emerald-400" },
    purple: { bg: "bg-purple-100 dark:bg-purple-950/60", text: "text-purple-600 dark:text-purple-400" },
    orange: { bg: "bg-orange-100 dark:bg-orange-950/60", text: "text-orange-600 dark:text-orange-400" },
    indigo: { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-600 dark:text-indigo-400" },
    teal: { bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-600 dark:text-teal-400" },
    amber: { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-600 dark:text-amber-400" },
    rose: { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-600 dark:text-rose-400" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl h-full p-[1.5px] transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${active
          ? "bg-gradient-to-r from-[#111A62] to-[#E15B1D] shadow-md shadow-[#111A62]/15 scale-[1.02]"
          : "bg-slate-200 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-[#111A62] hover:to-[#E15B1D] hover:shadow-lg hover:shadow-[#111A62]/10"
        }`}
    >
      <Card className="h-full rounded-[10px] border-0 bg-white dark:bg-[#0F163D]">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
            <div className={theme.text}>
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="text-2xl font-extrabold text-[#111A62] dark:text-white">{value}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
