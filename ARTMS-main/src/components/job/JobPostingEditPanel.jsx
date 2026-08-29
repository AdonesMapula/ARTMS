import { useState, useEffect } from "react";
import { Briefcase, Building2, Calendar, MapPin, DollarSign, FileText, CheckCircle, X, Save, Loader, AlertTriangle, GraduationCap, List, Plus, Trash2, Edit, FileCheck } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import DatePicker from "../ui/DatePicker";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { calculateSalaryBreakdown } from "../../utils/salaryUtils";

const STATUS_TONE = {
  published: "success",
  pending_approval: "warning",
  draft: "info",
  closed: "default",
  cancelled: "danger",
};

export default function JobPostingEditPanel({ postingId, initialPosting, onClose, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(!initialPosting);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [posting, setPosting] = useState(initialPosting || null);
  const [formData, setFormData] = useState({
    title: "",
    department_id: "",
    employment_type: "full_time",
    location: "",
    min_salary: "",
    max_salary: "",
    closing_date: "",
    status: "published",
    qualifications: [],
    responsibilities: [],
  });

  const [blockModal, setBlockModal] = useState({
    open: false,
    field: "qualifications",
    editingId: null,
  });
  const [blockTitle, setBlockTitle] = useState("");
  const [blockDetails, setBlockDetails] = useState([]);

  const populateForm = (data) => {
    if (!data) return;
    setPosting(data);

    const normalizeBlocks = (items) => {
      if (Array.isArray(items)) {
        return items.map((item, i) => {
          if (typeof item === 'string') return { id: Date.now() + i, title: "General", details: [{id: Date.now() + i + 1, value: item}] };
          return item;
        });
      }
      if (typeof items === "string" && items.trim()) {
        return [{ id: Date.now(), title: "General", details: [{id: Date.now()+1, value: items.trim()}] }];
      }
      return [];
    };

    const quals = normalizeBlocks(data.qualifications || data.job_library?.qualifications);
    const resps = normalizeBlocks(data.responsibilities || data.job_library?.responsibilities);

    setFormData({
      title: data.job_library?.job_title || data.title || "Job Specification",
      department_id: data.department_id || "",
      employment_type: data.job_library?.employment_type || data.employment_type || "full_time",
      location: data.location || "Cebu City, Philippines",
      min_salary: data.job_library?.salary_min ?? data.min_salary ?? "",
      max_salary: data.job_library?.salary_max ?? data.max_salary ?? "",
      closing_date: data.closing_date ? data.closing_date.slice(0, 10) : "",
      vacancies_count: data.vacancies_count ?? 1,
      status: data.status || "published",
      qualifications: quals,
      responsibilities: resps,
    });
  };

  useEffect(() => {
    if (initialPosting) {
      populateForm(initialPosting);
      setLoading(false);
    }
    if (postingId) {
      loadPosting();
    }
  }, [postingId, initialPosting]);

  const loadPosting = async () => {
    try {
      const res = await api.get(`/job-postings/${postingId}`);
      const data = res.data?.posting || res.data?.data || res.data;
      if (data && typeof data === 'object') {
        populateForm(data);
      }
    } catch (err) {
      console.error("Failed to load job posting details:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddBlockModal = (field) => {
    setBlockModal({ open: true, field, editingId: null });
    setBlockTitle("");
    setBlockDetails([{ id: Date.now(), value: "" }]);
  };

  const openEditBlockModal = (field, block) => {
    setBlockModal({ open: true, field, editingId: block.id });
    setBlockTitle(block.title || "");
    setBlockDetails(
      Array.isArray(block.details) && block.details.length > 0
        ? block.details.map((d) => ({ id: d.id || Date.now() + Math.random(), value: d.value || "" }))
        : [{ id: Date.now(), value: "" }]
    );
  };

  const removeBlock = (field, id) => {
    const current = Array.isArray(formData[field]) ? formData[field] : [];
    setFormData({
      ...formData,
      [field]: current.filter((b) => b.id !== id),
    });
  };

  const handleAddModalDetail = () => {
    setBlockDetails([
      ...blockDetails,
      { id: Date.now() + Math.random(), value: "" },
    ]);
  };

  const handleUpdateModalDetail = (id, value) => {
    setBlockDetails(
      blockDetails.map((d) => (d.id === id ? { ...d, value } : d))
    );
  };

  const handleRemoveModalDetail = (id) => {
    setBlockDetails(blockDetails.filter((d) => d.id !== id));
  };

  const handleSaveBlockModal = () => {
    if (!blockTitle.trim()) {
      toast.error("Please enter a title for this block before saving.");
      return;
    }

    const cleanDetails = blockDetails.filter((d) => d.value.trim() !== "");
    const currentBlocks = Array.isArray(formData[blockModal.field]) ? formData[blockModal.field] : [];

    let updatedBlocks;
    if (blockModal.editingId) {
      updatedBlocks = currentBlocks.map((b) =>
        b.id === blockModal.editingId
          ? { ...b, title: blockTitle.trim(), details: cleanDetails }
          : b
      );
    } else {
      updatedBlocks = [
        ...currentBlocks,
        { id: Date.now(), title: blockTitle.trim(), details: cleanDetails },
      ];
    }

    setFormData({ ...formData, [blockModal.field]: updatedBlocks });
    setBlockModal({ open: false, field: "qualifications", editingId: null });
    setBlockTitle("");
    setBlockDetails([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/job-postings/${postingId}`, formData);
      toast.success("Job Posting Updated", "Changes to job requirements and specification saved.");
      await loadPosting();
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update job posting.");
    } finally {
      setSaving(false);
    }
  };

  if (!posting && !loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Job Posting not found.
      </div>
    );
  }

  const jobTitle = posting?.job_library?.job_title || posting?.title || formData.title || "Job Specification";
  const deptName = posting?.department?.department_name || posting?.department?.name || "General";
  const postingIdStr = posting?.id ? `JP-${String(posting.id).padStart(3, "0")}` : `JOB #${postingId || ""}`;
  const vacanciesCount = posting?.vacancies_count ?? formData.vacancies_count ?? 1;

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wide text-slate-700">
              {postingIdStr}
            </span>
            <Badge tone={STATUS_TONE[posting?.status] || "default"} className="capitalize">
              {posting?.status || "Published"}
            </Badge>
            <span className="rounded-full bg-amber-100/50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
              {vacanciesCount} {vacanciesCount === 1 ? "position needed" : "positions needed"}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-[#111A62] tracking-tight truncate">
            {jobTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed truncate">
            Department: <strong className="text-slate-800">{deptName}</strong> • Applicants: <strong className="text-emerald-600">{posting?.applicants_count || 0} candidate(s)</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }}
            aria-label="Edit"
            className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-[#111A62] active:scale-95 cursor-pointer shadow-sm"
            title="Edit Job Posting"
          >
            <Edit className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
              }}
              aria-label="Close"
              className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95 cursor-pointer shadow-sm"
              title="Close Job Panel"
            >
              <X className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Body (View Mode) ──────────────────────────────────────────── */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto bg-slate-50/50 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader size={32} className="animate-spin text-[#111A62]" />
            <p className="text-xs font-semibold">Loading Job Details...</p>
          </div>
        ) : (
          <>
            {/* Meta Details Grid */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Employment Type</p>
                  <p className="truncate text-xs font-bold text-slate-900 capitalize">
                    {(posting?.job_library?.employment_type || posting?.employment_type || 'full_time').replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Salary Range</p>
                  <p className="truncate text-xs font-bold text-slate-900">
                    ₱{(posting?.job_library?.salary_min ?? posting?.min_salary ?? 0).toLocaleString()} - ₱{(posting?.job_library?.salary_max ?? posting?.max_salary ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                  <p className="truncate text-xs font-bold text-slate-900">{posting?.location || "Cebu City, Philippines"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Calendar size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Closing Date</p>
                  <p className="truncate text-xs font-bold text-slate-900">
                    {posting?.closing_date ? new Date(posting.closing_date).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Qualifications & Responsibilities View */}
            <div className="grid gap-6 sm:grid-cols-2 pt-2">
              {/* Qualifications */}
              <div className="flex flex-col">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <GraduationCap size={16} className="text-slate-400" />
                  Qualifications
                </h3>
                {(!Array.isArray(formData.qualifications) || formData.qualifications.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs text-slate-500 italic">No qualifications defined.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.qualifications.map((block) => (
                      <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                        {block.title && <h4 className="mb-2 font-bold text-slate-900 text-xs">{block.title}</h4>}
                        {block.details && block.details.length > 0 && (
                          <ul className="list-inside list-disc space-y-1.5 marker:text-slate-300 text-xs text-slate-600 font-medium">
                            {block.details.map((detail, idx) => (
                              <li key={detail.id || idx} className="leading-relaxed">{detail.value}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Responsibilities */}
              <div className="flex flex-col sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <List size={16} className="text-slate-400" />
                  Responsibilities
                </h3>
                {(!Array.isArray(formData.responsibilities) || formData.responsibilities.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs text-slate-500 italic">No responsibilities defined.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.responsibilities.map((block) => (
                      <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                        {block.title && <h4 className="mb-2 font-bold text-slate-900 text-xs">{block.title}</h4>}
                        {block.details && block.details.length > 0 && (
                          <ul className="list-inside list-disc space-y-1.5 marker:text-slate-300 text-xs text-slate-600 font-medium">
                            {block.details.map((detail, idx) => (
                              <li key={detail.id || idx} className="leading-relaxed">{detail.value}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* ── Edit Form Modal ────────────────────────────────────────── */}
    <Modal
      open={isEditing}
      onClose={() => setIsEditing(false)}
      className="max-w-4xl"
      title={
        <div className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-[#111A62]" />
          <span>Edit Job Posting</span>
        </div>
      }
      description="Modify the job posting details, qualifications, and responsibilities."
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="cursor-pointer">Cancel</Button>
          <Button type="button" variant="primary" onClick={(e) => handleSave(e)} disabled={saving} className="bg-[#111A62] text-white gap-1 cursor-pointer">
            {saving ? "Saving Changes..." : <><Save size={14} /> Save Job Specifications</>}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-6 py-2">
        {/* Quick Controls Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Select
              label="Job Status"
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              options={[
                { value: "published", label: "Published / Active" },
                { value: "pending_approval", label: "Pending Approval" },
                { value: "revised", label: "Needs Revision" },
                { value: "closed", label: "Closed / Inactive" },
                { value: "draft", label: "Draft" },
              ]}
              placeholder="Select Status"
            />
          </div>

          <div>
            <Input
              label="Work Location / Setup"
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Cebu City, Philippines"
            />
          </div>

          <div>
            <Input
              label="Min Salary (₱)"
              type="number"
              value={formData.min_salary}
              onChange={e => setFormData({ ...formData, min_salary: e.target.value })}
              placeholder="30000"
            />
          </div>

          <div>
            <Input
              label="Max Salary (₱)"
              type="number"
              value={formData.max_salary}
              onChange={e => setFormData({ ...formData, max_salary: e.target.value })}
              placeholder="50000"
            />
          </div>

          <div>
            <DatePicker
              label="Application Closing Date"
              value={formData.closing_date}
              onChange={(val) => setFormData({ ...formData, closing_date: val })}
              placeholder="Select Date"
            />
          </div>

          <div>
            <Input
              label="Positions Needed (Vacancies)"
              type="number"
              min="1"
              value={formData.vacancies_count}
              onChange={e => setFormData({ ...formData, vacancies_count: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
        </div>

        {/* Qualifications & Responsibilities Grid */}
        <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-200 mt-4">
          {/* Qualifications */}
          <div className="flex flex-col h-full">
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <GraduationCap size={16} className="text-slate-400" />
                Qualifications
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openAddBlockModal("qualifications")}
                className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
              >
                <Plus size={14} /> Add Block
              </Button>
            </div>

            {(!Array.isArray(formData.qualifications) || formData.qualifications.length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 italic">No qualifications added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.qualifications.map((block) => (
                  <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditBlockModal("qualifications", block)}
                          className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Block"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock("qualifications", block.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {block.details && block.details.length > 0 && (
                      <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                        {block.details.map((detail, idx) => (
                          <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">
                            {detail.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Responsibilities */}
          <div className="flex flex-col h-full sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <List size={16} className="text-slate-400" />
                Responsibilities
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openAddBlockModal("responsibilities")}
                className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
              >
                <Plus size={14} /> Add Block
              </Button>
            </div>

            {(!Array.isArray(formData.responsibilities) || formData.responsibilities.length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 italic">No responsibilities added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.responsibilities.map((block) => (
                  <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditBlockModal("responsibilities", block)}
                          className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Block"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock("responsibilities", block.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {block.details && block.details.length > 0 && (
                      <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                        {block.details.map((detail, idx) => (
                          <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">
                            {detail.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>

    {/* Qualification / Responsibility Block Sub-Modal */}
    <Modal
      open={blockModal.open}
      containerClassName="z-[110]"
      onClose={() => setBlockModal({ open: false, field: "qualifications", editingId: null })}
      className="max-w-xl"
      title={
        <div className="flex items-center gap-2">
          {blockModal.field === "qualifications" ? (
            <GraduationCap className="h-5 w-5 text-blue-600" />
          ) : (
            <List className="h-5 w-5 text-blue-600" />
          )}
          <span>
            {blockModal.editingId ? "Edit" : "Add"}{" "}
            {blockModal.field === "qualifications" ? "Qualification Block" : "Responsibility Block"}
          </span>
        </div>
      }
      description={
        blockModal.field === "qualifications"
          ? "Group qualifications into categories (e.g. Educational Background, Skills) with bullet items."
          : "Group responsibilities into categories (e.g. Core Duties, Reporting) with bullet items."
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setBlockModal({ open: false, field: "qualifications", editingId: null })}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveBlockModal}
            disabled={!blockTitle.trim()}
            className="gap-1.5"
          >
            <FileCheck size={16} />
            <span>Save Block</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Title */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileCheck size={14} className="text-slate-400" />
            Category / Block Title <span className="text-red-500">*</span>
          </label>
          <Input
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            placeholder={
              blockModal.field === "qualifications"
                ? "e.g., Educational Background, Technical Skills"
                : "e.g., Core Duties, Daily Operations"
            }
            autoFocus
          />
        </div>

        {/* Details Bullet Items */}
        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <List size={14} className="text-slate-400" />
              <span>Specific Bullet Items</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddModalDetail}
              className="h-7 gap-1 text-xs border-[#111A62] text-[#111A62] hover:bg-[#111A62]/10"
            >
              <Plus size={12} /> Add Item
            </Button>
          </label>

          {blockDetails.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No detail items added yet. Click "Add Item" to add bullet points.</p>
          ) : (
            <div className="space-y-2.5">
              {blockDetails.map((detail, index) => (
                <div key={detail.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-4 text-center shrink-0">
                    {index + 1}.
                  </span>
                  <Input
                    placeholder={
                      blockModal.field === "qualifications"
                        ? "e.g., Bachelor's Degree in Computer Science"
                        : "e.g., Manage customer inquiries and process support tickets"
                    }
                    value={detail.value}
                    onChange={(e) => handleUpdateModalDetail(detail.id, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveModalDetail(detail.id)}
                    className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10 px-2.5 cursor-pointer"
                    title="Remove Item"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  </>
  );
}
