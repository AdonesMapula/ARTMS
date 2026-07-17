import { useEffect, useState } from "react";
import { FiBriefcase, FiEye, FiEyeOff, FiCheckCircle, FiClock, FiPlus, FiX } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import AlertModal from "../../components/ui/AlertModal";
import api from "../../services/api";

const STATUS_TONE = { published: "success", pending_approval: "warning", draft: "info", closed: "default", cancelled: "danger" };
const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };

export default function JobPosting() {
  const [approvedPRFs, setApprovedPRFs] = useState([]);
  const [postings, setPostings] = useState([]);
  const [jobLibrary, setJobLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPRF, setSelectedPRF] = useState(null);
  const [formData, setFormData] = useState({
    job_library_id: "",
    location: "",
    description: "",
    closing_date: "",
  });
  const [alertModal, setAlertModal] = useState({ open: false, variant: "success", title: "", message: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prfRes, postingsRes, jobLibRes] = await Promise.all([
        api.get("/manpower-requests-approved-for-posting"),
        api.get("/job-postings"),
        api.get("/job-library"),
      ]);
      setApprovedPRFs(prfRes.data.data || []);
      setPostings(postingsRes.data.data || []);
      setJobLibrary(jobLibRes.data.data || jobLibRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: "Failed to load job posting data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (prf) => {
    setSelectedPRF(prf);
    setFormData({
      job_library_id: prf.job_library_id || "",
      location: "",
      description: prf.justification || "",
      closing_date: "",
    });
    setCreateModalOpen(true);
  };

  const handleCreatePosting = async () => {
    if (!selectedPRF) return;

    // Validation
    if (!formData.job_library_id) {
      setAlertModal({
        open: true,
        variant: "error",
        title: "Missing Job Title",
        message: "Please select a job title from the Job Library before creating the posting.",
      });
      return;
    }

    try {
      await api.post("/job-postings", {
        job_library_id: formData.job_library_id,
        department_id: selectedPRF.department_id,
        manpower_request_id: selectedPRF.id,
        vacancies_count: selectedPRF.headcount,
        location: formData.location,
        description: formData.description,
        closing_date: formData.closing_date || null,
      });

      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: "Job posting created and submitted for COO approval.",
      });
      setCreateModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating posting:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to create job posting.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Posting</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Job Posting Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage and monitor all active and pending job postings.</p>
      </div>

      {/* Approved PRFs - Ready for Job Posting */}
      {approvedPRFs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Approved PRFs - Ready for Posting</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>Position</TH>
                  <TH>Department</TH>
                  <TH>Headcount</TH>
                  <TH>Urgency</TH>
                  <TH>Approved By</TH>
                  <TH>Action</TH>
                </tr>
              </THead>
              <tbody>
                {approvedPRFs.map((prf) => (
                  <tr key={prf.id} className="hover:bg-slate-50">
                    <TD>
                      <div>
                        <p className="font-semibold text-slate-900">{prf.position_needed}</p>
                        <p className="text-xs text-slate-400">PRF-{String(prf.id).padStart(3, "0")}</p>
                      </div>
                    </TD>
                    <TD className="text-slate-600">{prf.department?.name}</TD>
                    <TD className="font-bold text-slate-900">{prf.headcount}</TD>
                    <TD>
                      <Badge tone={prf.urgency === "critical" ? "danger" : prf.urgency === "high" ? "warning" : "info"}>
                        {prf.urgency}
                      </Badge>
                    </TD>
                    <TD className="text-slate-600 text-sm">{prf.approver?.name || "N/A"}</TD>
                    <TD>
                      <Button variant="primary" size="sm" onClick={() => openCreateModal(prf)}>
                        <FiPlus /> Create Posting
                      </Button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Published",  value: postings.filter(p => p.status === "published").length,  icon: <FiEye />,          tone: "bg-emerald-50 text-emerald-700" },
          { label: "Pending",    value: postings.filter(p => p.status === "pending_approval").length,    icon: <FiClock />,         tone: "bg-amber-50 text-amber-700"    },
          { label: "Closed",     value: postings.filter(p => p.status === "closed").length,     icon: <FiEyeOff />,        tone: "bg-slate-100 text-slate-500"   },
          { label: "Total Apps", value: postings.reduce((s, p) => s + (p.applicants_count || 0), 0),         icon: <FiBriefcase />,     tone: "bg-blue-50 text-blue-700"      },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.tone}`}>{s.icon}</div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All Job Postings</CardTitle></CardHeader>
        <CardContent>
          {postings.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No job postings yet. Create one from an approved PRF above.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Job Title</TH>
                  <TH>Department</TH>
                  <TH>Vacancies</TH>
                  <TH>Applicants</TH>
                  <TH>COO Approval</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <tbody>
                {postings.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <FiBriefcase size={14} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{p.job_library?.job_title || "N/A"}</p>
                          <p className="text-xs text-slate-400">JP-{String(p.id).padStart(3, "0")}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-slate-600">{p.department?.name}</TD>
                    <TD className="font-bold text-slate-900">{p.vacancies_count}</TD>
                    <TD>
                      <span className="font-bold text-slate-900">{p.applicants_count || 0}</span>
                      <span className="text-slate-400 text-xs"> apps</span>
                    </TD>
                    <TD><Badge tone={APPROVAL_TONE[p.approval_status] ?? "default"}>{p.approval_status}</Badge></TD>
                    <TD><Badge tone={STATUS_TONE[p.status] ?? "default"}>{p.status}</Badge></TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Job Posting Modal */}
      <Modal
        open={createModalOpen}
        title="Create Job Posting"
        description={selectedPRF ? `Converting PRF-${String(selectedPRF.id).padStart(3, "0")} to job posting` : ""}
        onClose={() => setCreateModalOpen(false)}
      >
        {selectedPRF && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">PRF Details</p>
              <p className="font-semibold text-slate-900">{selectedPRF.position_needed}</p>
              <p className="text-sm text-slate-600 mt-1">{selectedPRF.department?.name} • {selectedPRF.headcount} {selectedPRF.headcount > 1 ? "positions" : "position"}</p>
              {selectedPRF.justification && (
                <p className="text-xs text-slate-500 mt-2 italic">"{selectedPRF.justification}"</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Job Title <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                value={formData.job_library_id}
                onChange={(e) => setFormData({ ...formData, job_library_id: e.target.value })}
              >
                <option value="">Select a job title from library...</option>
                {jobLibrary.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.job_title} - {job.department?.name || "N/A"}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Choose the official job title from the Job Library. This determines the job description and requirements.
              </p>
            </div>

            <Input
              label="Location"
              placeholder="e.g., Makati City, Metro Manila, Remote, Hybrid"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Additional Description / Special Instructions
              </label>
              <textarea
                className="min-h-32 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                placeholder="Add any specific requirements, benefits, or details for this posting that aren't in the standard job description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-500">
                This will be shown alongside the standard job description from the Job Library.
              </p>
            </div>

            <Input
              label="Application Deadline"
              type="date"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="flex-1">
                <FiX /> Cancel
              </Button>
              <Button variant="primary" onClick={handleCreatePosting} className="flex-1">
                <FiCheckCircle /> Submit for COO Approval
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
      />
    </div>
  );
}
