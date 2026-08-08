import { useState, useEffect } from "react";
import { 
  FileText, Plus, Trash2, RefreshCw, AlertTriangle, 
  CheckCircle, FileCheck, Edit, GraduationCap, List, X, Briefcase, Users
} from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import DatePicker from "../components/ui/DatePicker";
import api from "../services/api";

const URGENCY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "probationary", label: "Probationary" },
  { value: "project_based", label: "Project-Based" },
  { value: "seasonal", label: "Seasonal" },
  { value: "ojt", label: "OJT" },
];

const PLANTILLA_OPTIONS = [
  { value: "replacement", label: "Replacement" },
  { value: "additional", label: "Additional Manpower" },
  { value: "new_position", label: "Newly Created Position" },
];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative overflow-hidden rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-200",
        active
          ? "border-[#111A62] bg-gradient-to-br from-[#111A62] to-[#0d1449] text-white shadow-lg shadow-[#111A62]/20 scale-105"
          : "border-slate-200 bg-white text-slate-700 hover:border-[#111A62]/40 hover:bg-gradient-to-br hover:from-slate-50 hover:to-white hover:shadow-md",
      ].join(" ")}
    >
      {active && (
        <div className="absolute right-2 top-2">
          <CheckCircle size={14} className="text-white" />
        </div>
      )}
      {children}
    </button>
  );
}

/**
 * ManpowerEditModal - HR Edit & Resubmit Modal for PRFs marked for revision
 */
export default function ManpowerEditModal({ open, request, onClose, onSave, saving = false }) {
  const [form, setForm] = useState({
    position_needed: "",
    headcount: 1,
    urgency: "medium",
    needed_by: "",
    justification: "",
    employment_status: "",
    plantilla_type: "",
    replacement_for: "",
    qualifications: [],
    responsibilities: [],
    job_library_id: null,
  });

  const [jobLibrary, setJobLibrary] = useState([]);
  
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
      fetchJobLibrary();
    }
  }, [open]);

  useEffect(() => {
    if (request && open) {
      const normalizeBlocks = (blocks) => {
        if (!Array.isArray(blocks)) return [];
        return blocks.map((b, i) => ({
          id: b.id || Date.now() + i,
          title: typeof b === "string" ? b : (b.title || ""),
          details: Array.isArray(b.details)
            ? b.details.map((d, j) => ({
                id: typeof d === "object" && d !== null && d.id ? d.id : Date.now() + i * 100 + j,
                value: typeof d === "object" && d !== null ? (d.value ?? d.title ?? "") : String(d ?? ""),
              }))
            : typeof b.details === "string" && b.details
            ? [{ id: Date.now() + i * 100, value: b.details }]
            : [],
        }));
      };

      // Parse employment_status & plantilla_type from justification if not stored as separate fields
      let empStatus = request.employment_status ?? "";
      let plantType = request.plantilla_type ?? "";
      let replFor = request.replacement_for ?? "";

      if (!empStatus && request.justification) {
        const empMatch = request.justification.match(/Employment Status:\s*([^|]+)/i);
        if (empMatch) {
          empStatus = empMatch[1].trim().toLowerCase().replace(/[\s-]+/g, "_");
        }
      }
      if (!plantType && request.justification) {
        const plantMatch = request.justification.match(/Plantilla Type:\s*([^|]+)/i);
        if (plantMatch) {
          const raw = plantMatch[1].trim().toLowerCase();
          if (raw.includes("replacement")) plantType = "replacement";
          else if (raw.includes("additional")) plantType = "additional";
          else if (raw.includes("new")) plantType = "new_position";
        }
      }
      if (!replFor && request.justification) {
        const replMatch = request.justification.match(/Replacement For:\s*([^|]+)/i);
        if (replMatch) replFor = replMatch[1].trim();
      }

      setForm({
        position_needed: request.position_needed ?? "",
        headcount: request.headcount ?? 1,
        urgency: request.urgency ?? "medium",
        needed_by: request.needed_by ? request.needed_by.substring(0, 10) : "",
        justification: request.justification ?? "",
        employment_status: empStatus,
        plantilla_type: plantType,
        replacement_for: replFor,
        qualifications: normalizeBlocks(request.qualifications),
        responsibilities: normalizeBlocks(request.responsibilities),
        job_library_id: request.job_library_id ?? null,
      });
    }
  }, [request, open]);

  const fetchJobLibrary = async () => {
    try {
      const res = await api.get('/job-library/approved');
      setJobLibrary(res.data.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch job library', e);
    }
  };

  if (!open || !request) return null;

  const remarksText = request.approval_remarks || request.remarks;

  const qualBlocks = Array.isArray(form?.qualifications) ? form.qualifications : [];
  const respBlocks = Array.isArray(form?.responsibilities) ? form.responsibilities : [];

  // ─── Block Modal Handlers ────────────────────────────────────────────────────────
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

  const handleSaveBlock = () => {
    if (!blockTitle.trim()) {
      alert("Please provide a category title.");
      return;
    }

    const filteredDetails = blockDetails.filter((d) => d.value.trim() !== "");
    if (filteredDetails.length === 0) {
      alert("Please provide at least one item detail.");
      return;
    }

    const newBlock = {
      id: blockModal.editingId || Date.now(),
      title: blockTitle.trim(),
      details: filteredDetails,
    };

    const currentBlocks = Array.isArray(form[blockModal.field]) ? form[blockModal.field] : [];

    if (blockModal.editingId) {
      setForm({
        ...form,
        [blockModal.field]: currentBlocks.map((b) => (b.id === blockModal.editingId ? newBlock : b)),
      });
    } else {
      setForm({
        ...form,
        [blockModal.field]: [...currentBlocks, newBlock],
      });
    }

    setBlockModal({ open: false, field: "qualifications", editingId: null });
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const handleJobSelect = (e) => {
    const selectedJobId = e.target.value;

    if (!selectedJobId) {
      setForm((prev) => ({ 
        ...prev, 
        job_library_id: null,
        position_needed: "" 
      }));
      return;
    }

    const selectedJob = jobLibrary.find(j => String(j.id) === String(selectedJobId));
    if (selectedJob) {
      setForm((prev) => ({
        ...prev,
        job_library_id: selectedJob.id,
        position_needed: selectedJob.job_title,
        qualifications: Array.isArray(selectedJob.qualifications) && selectedJob.qualifications.length > 0 
          ? selectedJob.qualifications : prev.qualifications,
        responsibilities: Array.isArray(selectedJob.responsibilities) && selectedJob.responsibilities.length > 0 
          ? selectedJob.responsibilities : prev.responsibilities,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        className="max-w-5xl"
        title={`Revise PRF-${String(request.id).padStart(3, "0")}`}
        description="Edit personnel requisition form and resubmit to COO for approval"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 font-bold"
            >
              {saving ? "Resubmitting..." : "Resubmit PRF to COO"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* COO Feedback Banner */}
          {remarksText && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    COO Revision Instructions & Remarks
                  </h4>
                  <p className="mt-1 text-sm font-medium text-amber-900 whitespace-pre-wrap leading-relaxed">
                    "{remarksText}"
                  </p>
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    💡 Make the requested adjustments below and click "Resubmit PRF to COO".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <FileText size={16} className="text-slate-400" /> Requisition Details
              </h3>
              
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Position Needed <span className="text-red-500">*</span>
                </label>
                {jobLibrary.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    Loading job positions...
                  </div>
                ) : (
                  <Select
                    value={form.job_library_id || ""}
                    onChange={handleJobSelect}
                    options={[
                      { value: "", label: "Select a position from the Job Library..." },
                      ...jobLibrary.map((j) => ({
                        value: String(j.id),
                        label: `${j.job_title}${j.job_category ? ` — ${j.job_category}` : ""}`,
                      })),
                    ]}
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Headcount <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={form.headcount}
                    onChange={(e) => setForm({ ...form, headcount: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Urgency</label>
                  <Select
                    value={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                    options={URGENCY_OPTIONS}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Date Needed By</label>
                <DatePicker
                  value={form.needed_by}
                  onChange={(val) => setForm({ ...form, needed_by: val })}
                  placeholder="Select date needed"
                  disablePast
                />
              </div>


              
              {/* Employment Status */}
              <div className="pt-4 border-t border-slate-200 mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase size={14} className="text-[#F97316]" />
                    <span>Employment Status</span>
                    <span className="text-xs font-normal text-slate-400">(select one)</span>
                  </div>
                </label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                    <Pill
                      key={opt.value}
                      active={form.employment_status === opt.value}
                      onClick={() =>
                        setForm({ ...form, employment_status: form.employment_status === opt.value ? "" : opt.value })
                      }
                    >
                      {opt.label}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>

          {/* Plantilla Requirement Box */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
              <FileText size={16} className="text-slate-400" /> Plantilla Requirement
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-3">
              {PLANTILLA_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={form.plantilla_type === opt.value}
                  onClick={() =>
                    setForm({ ...form, plantilla_type: form.plantilla_type === opt.value ? "" : opt.value })
                  }
                >
                  {opt.label}
                </Pill>
              ))}
            </div>

            {form.plantilla_type === "replacement" && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-blue-600" />
                    <span>Replacement For</span>
                  </div>
                </label>
                <Input
                  type="text"
                  value={form.replacement_for}
                  onChange={(e) => setForm({ ...form, replacement_for: e.target.value })}
                  placeholder="Name of employee being replaced"
                />
              </div>
            )}
          </div>



          {/* Qualifications & Responsibilities Grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-200">
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

          {/* Info Box at the end of form */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck size={18} className="text-blue-600" />
              <p className="text-sm font-bold text-blue-900">
                Requisition Guidelines
              </p>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-blue-700 leading-relaxed">
              <li>• Use the dropdown to select a pre-approved position from the Job Library to automatically fill qualifications.</li>
              <li>• Ensure the headcount strictly aligns with the approved department budget.</li>
              <li>• "Critical" urgency requires extensive justification and immediate availability.</li>
            </ul>
          </div>
        </form>
      </Modal>

      {/* ── Block Management Modal (Add / Edit) ── */}
      <Modal
        open={blockModal.open}
        onClose={() => setBlockModal({ ...blockModal, open: false })}
        title={blockModal.editingId ? "Edit Category Block" : "Add Category Block"}
        description={
          blockModal.field === "qualifications"
            ? "Group similar qualifications together (e.g. Technical Skills, Soft Skills)"
            : "Group similar responsibilities together (e.g. Daily Tasks, Leadership)"
        }
        className="max-w-md z-[60]"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBlockModal({ ...blockModal, open: false })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveBlock}>
              Save Block
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category Title</label>
            <Input
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder={blockModal.field === "qualifications" ? "e.g., Technical Skills" : "e.g., Daily Operations"}
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Items List</label>
              <button
                type="button"
                onClick={handleAddModalDetail}
                className="text-[11px] font-bold text-[#111A62] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {blockDetails.map((detail, index) => (
                <div key={detail.id} className="flex items-start gap-2 group">
                  <div className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 group-hover:bg-[#111A62] transition-colors" />
                  <textarea
                    rows={2}
                    value={detail.value}
                    onChange={(e) => handleUpdateModalDetail(detail.id, e.target.value)}
                    placeholder="Enter detail..."
                    className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-[#111A62] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveModalDetail(detail.id)}
                    className="mt-1 shrink-0 p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                    disabled={blockDetails.length === 1}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
