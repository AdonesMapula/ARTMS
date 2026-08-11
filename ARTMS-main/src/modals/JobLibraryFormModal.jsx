import { useState, useEffect } from "react";
import { FileText, Hash, DollarSign, Briefcase, List, FileCheck, Plus, Trash2, GraduationCap, X, FolderPlus, Edit, AlertTriangle, XCircle } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import api from "../services/api";
import { calculateSalaryBreakdown } from "../utils/salaryUtils";
import { useToast } from "../context/ToastContext";

/**
 * JobLibraryFormModal - Create or Edit Job Library Entry
 */
export default function JobLibraryFormModal({
  open,
  mode,
  data,
  initialData,
  form: propForm,
  setForm: propSetForm,
  onClose,
  onSave,
  saving = false,
}) {
  const toast = useToast();
  const targetData = data || initialData;
  const isRejected = mode === "edit" && targetData?.approval_status === "rejected";
  const isRevised = mode === "edit" && targetData?.approval_status === "revised";
  const remarksText = targetData?.approval_remarks || targetData?.remarks;

  const [internalForm, setInternalForm] = useState({
    job_title: "",
    job_description: "",
    qualifications: [],
    responsibilities: [],
    job_category: "",
    employment_type: "full_time",
    salary_type: "exact",
    salary_min: "",
    salary_max: "",
    hr_remarks: "",
  });

  const form = propForm || internalForm;
  const setForm = propSetForm || setInternalForm;

  const qualBlocks = Array.isArray(form?.qualifications) ? form.qualifications : [];
  const respBlocks = Array.isArray(form?.responsibilities) ? form.responsibilities : [];

  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Block Modal state (for Qualifications & Responsibilities)
  const [blockModal, setBlockModal] = useState({
    open: false,
    field: "qualifications",
    editingId: null,
  });
  const [blockTitle, setBlockTitle] = useState("");
  const [blockDetails, setBlockDetails] = useState([]);

  useEffect(() => {
    if (open) {
      fetchCategories();
      setShowCategoryModal(false);
      setNewCategory("");
      const init = initialData || data || {};
      setInternalForm({
        id: init.id,
        job_title: init.job_title || "",
        job_description: init.job_description || "",
        qualifications: Array.isArray(init.qualifications) ? init.qualifications : [],
        responsibilities: Array.isArray(init.responsibilities) ? init.responsibilities : [],
        job_category: init.job_category || "",
        employment_type: init.employment_type || "full_time",
        salary_type: init.salary_type || "exact",
        salary_min: init.salary_min ?? "",
        salary_max: init.salary_max ?? "",
        hr_remarks: "",
      });
    }
  }, [open, initialData, data]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/job-categories');
      setCategories(res.data);
    } catch (e) {
      console.error('Failed to fetch job categories', e);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setSavingCategory(true);
    try {
      const res = await api.post('/job-categories', { name: newCategory.trim() });
      const updated = [...categories, res.data].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(updated);
      setForm({ ...form, job_category: res.data.name });
      setShowCategoryModal(false);
      setNewCategory("");
    } catch (e) {
      console.error('Failed to add category', e);
      toast.error("Category Error", e.response?.data?.message || 'Failed to add category.');
    } finally {
      setSavingCategory(false);
    }
  };

  // Block Modal Handlers
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
    const current = Array.isArray(form[field]) ? form[field] : [];
    setForm({
      ...form,
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
      toast.warning("Missing Title", "Please enter a title for this block before saving.");
      return;
    }

    const cleanDetails = blockDetails.filter((d) => d.value.trim() !== "");
    const currentBlocks = Array.isArray(form[blockModal.field]) ? form[blockModal.field] : [];

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

    setForm({ ...form, [blockModal.field]: updatedBlocks });
    setBlockModal({ open: false, field: "qualifications", editingId: null });
    setBlockTitle("");
    setBlockDetails([]);
  };

  if (!open) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        className="max-w-4xl"
        title={mode === "create" ? "Add Job Entry" : (isRejected ? "Revise Rejected Job Entry" : "Edit Job Entry")}
        description={
          mode === "create"
            ? "New entries require COO approval before appearing in PRF dropdowns"
            : (isRejected
              ? `Review COO feedback below and resubmit JL-${String(data?.id ?? 0).padStart(3, "0")}`
              : `Editing JL-${String(data?.id ?? 0).padStart(3, "0")}`)
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant={isRejected || isRevised ? "primary" : "primary"} onClick={() => onSave(form)} disabled={saving} className={isRejected ? "bg-red-600 hover:bg-red-700 font-bold" : isRevised ? "bg-amber-600 hover:bg-amber-700 font-bold" : ""}>
              {saving
                ? "Saving..."
                : isRejected || isRevised
                  ? "Revise & Resubmit to COO"
                  : mode === "create"
                    ? "Submit for Approval"
                    : "Save Changes"}
            </Button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-6">
          {/* COO Feedback Banner for Rejected Entries */}
          {isRejected && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-amber-50/60 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
                  <XCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    COO Rejection Remarks & Feedback
                  </h4>
                  <p className="mt-1 text-sm font-medium text-red-800 whitespace-pre-wrap">
                    {remarksText || "No specific feedback or remarks provided by the COO."}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    💡 Modify the qualifications, responsibilities, or details below to address the COO's feedback, then click "Revise & Resubmit to COO".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* COO Revision Feedback Banner */}
          {isRevised && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Action Required: COO Revision Feedback
                  </h4>
                  <p className="mt-1 text-sm font-medium text-amber-800 whitespace-pre-wrap">
                    {remarksText || "No specific revision details provided by the COO."}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    💡 Please apply the requested changes below, then explicitly state what you changed so the COO can review it quickly.
                  </p>
                </div>
              </div>
              <div className="border-t border-amber-200/50 pt-4">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-amber-900">
                  HR Revision Notes (What did you change?) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  className="w-full resize-none rounded-lg border border-amber-300/60 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200"
                  placeholder="e.g., Updated the salary range and added 2 years of experience required as requested..."
                  value={form.hr_remarks}
                  onChange={(e) => setForm({ ...form, hr_remarks: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-blue-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                Basic Information
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              {/* Job Title */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileCheck size={14} className="text-slate-400" />
                  Job Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  placeholder="e.g., Customer Service Representative"
                />
              </div>

              {/* Category & Employment Type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Hash size={14} className="text-slate-400" />
                    Job Category
                  </label>

                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <Select
                        value={form.job_category}
                        onChange={(e) => setForm({ ...form, job_category: e.target.value })}
                        options={[
                          { value: "", label: "Select a Category" },
                          ...categories.map(c => ({ value: c.name, label: c.name }))
                        ]}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCategoryModal(true)}
                      className="h-11 shrink-0 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 hover:border-[#111A62] active:bg-[#111A62]/20 transition-all duration-200 px-3.5 cursor-pointer shadow-2xs font-semibold"
                      title="Add New Category"
                    >
                      <Plus size={16} />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Briefcase size={14} className="text-slate-400" />
                    Employment Type
                  </label>
                  <Select
                    value={form.employment_type}
                    onChange={(e) =>
                      setForm({ ...form, employment_type: e.target.value })
                    }
                    options={[
                      { value: "full_time", label: "Full-time" },
                      { value: "part_time", label: "Part-time" },
                      { value: "contractual", label: "Contractual" },
                      { value: "project_based", label: "Project-based" },
                      { value: "probationary", label: "Probationary" },
                      { value: "ojt", label: "OJT / Internship" },
                    ]}
                  />
                </div>
              </div>

              {/* Salary Details */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <DollarSign size={14} className="text-slate-400" />
                    Salary Type
                  </label>
                  <Select
                    value={form.salary_type || "exact"}
                    onChange={(e) => {
                      const type = e.target.value;
                      setForm({
                        ...form,
                        salary_type: type,
                        ...(type === "exact" ? { salary_max: form.salary_min } : {})
                      });
                    }}
                    options={[
                      { value: "exact", label: "Exact Monthly Salary" },
                      { value: "range", label: "Salary Range (Min - Max)" }
                    ]}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <DollarSign size={14} className="text-slate-400" />
                      {form.salary_type === "exact" ? "Monthly Salary (₱)" : "Monthly Salary Min (₱)"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.salary_min}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          salary_min: val,
                          ...(form.salary_type === "exact" ? { salary_max: val } : {})
                        });
                      }}
                      placeholder="e.g., 20000"
                    />
                  </div>

                  {form.salary_type !== "exact" && (
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <DollarSign size={14} className="text-slate-400" />
                        Monthly Salary Max (₱)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={form.salary_max}
                        onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                        placeholder="e.g., 35000"
                      />
                    </div>
                  )}
                </div>

                {/* Salary Breakdown Preview */}
                {(() => {
                  const bd = calculateSalaryBreakdown(form.salary_min, form.salary_max, form.salary_type);
                  if (!bd) return null;
                  return (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs">
                      <p className="font-bold text-[#111A62] mb-2 flex items-center gap-1.5">
                        <DollarSign size={14} className="text-blue-600" />
                        Estimated Compensation Breakdown
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-white p-2 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Weekly Rate</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bd.formatted.weekly}</span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Daily Rate</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bd.formatted.daily}</span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Hourly Rate</span>
                          <span className="font-bold text-[#111A62] text-xs mt-0.5 block">{bd.formatted.hourly}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 text-center italic">
                        Calculated based on standard PH labor rates (261 working days/yr, 8 hrs/day).
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <List size={16} className="text-blue-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                Job Details
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              {/* Job Description */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText size={14} className="text-slate-400" />
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Brief overview of the role and its purpose..."
                  value={form.job_description}
                  onChange={(e) =>
                    setForm({ ...form, job_description: e.target.value })
                  }
                />
              </div>

              {/* Qualifications & Responsibilities Grid */}
              <div className="grid gap-6 sm:grid-cols-2 pt-2">
                {/* Qualifications */}
                <div className="flex flex-col h-full">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <GraduationCap size={16} className="text-slate-400" />
                      Qualifications <span className="text-red-500">*</span>
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

                  {qualBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                      <p className="text-xs text-slate-500 italic">No qualifications added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qualBlocks.map((block) => (
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
                      Responsibilities <span className="text-red-500">*</span>
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

                  {respBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                      <p className="text-xs text-slate-500 italic">No responsibilities added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {respBlocks.map((block) => (
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
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-900">
              💡 Job Library Information
            </p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>• All new entries require COO approval before use</li>
              <li>• Approved entries appear in PRF position dropdowns</li>
              <li>• Templates can be reused across multiple job postings</li>
              <li>• Qualifications and responsibilities auto-fill PRF forms</li>
            </ul>
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
              <p className="text-xs text-slate-400 italic">No detail items added yet. Click &quot;Add Item&quot; to add bullet points.</p>
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

      {/* Add Job Category Sub-Modal */}
      <Modal
        open={showCategoryModal}
        containerClassName="z-[110]"
        onClose={() => {
          if (!savingCategory) {
            setShowCategoryModal(false);
            setNewCategory("");
          }
        }}
        className="max-w-md"
        title={
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            <span>Add Job Category</span>
          </div>
        }
        description="Create a new standardized job category to classify positions across the system."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategory("");
              }}
              disabled={savingCategory}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddCategory}
              disabled={savingCategory || !newCategory.trim()}
              className="gap-1.5"
            >
              <Plus size={16} />
              {savingCategory ? "Adding..." : "Add Category"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Hash size={14} className="text-slate-400" />
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., Operations, Finance, IT"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newCategory.trim() && !savingCategory) {
                    handleAddCategory();
                  }
                }
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
