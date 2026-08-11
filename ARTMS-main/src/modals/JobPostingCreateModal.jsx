import { useState, useEffect } from "react";
import { Plus, Briefcase, Building2, DollarSign, FileText, GraduationCap, List, FileCheck, Trash2, Edit, Save, AlignLeft } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import DatePicker from "../components/ui/DatePicker";

export default function JobPostingCreateModal({ open, prf, onClose, onSave }) {
  const [formData, setFormData] = useState({
    location: "",
    closing_date: "",
    description: "",
    qualifications: [],
    responsibilities: [],
  });

  const [createBlockModal, setCreateBlockModal] = useState({ open: false, field: "qualifications", editingId: null });
  const [createBlockTitle, setCreateBlockTitle] = useState("");
  const [createBlockDetails, setCreateBlockDetails] = useState([{ id: Date.now(), value: "" }]);

  useEffect(() => {
    if (open && prf) {
      setFormData({
        location: prf.job_library?.location || "",
        closing_date: "",
        description: prf.job_library?.job_description || "",
        qualifications: prf.qualifications || prf.job_library?.qualifications || [],
        responsibilities: prf.responsibilities || prf.job_library?.responsibilities || [],
      });
    }
  }, [open, prf]);

  if (!open || !prf) return null;

  // Block handlers
  const openCreateAddBlock = (field) => {
    setCreateBlockModal({ open: true, field, editingId: null });
    setCreateBlockTitle("");
    setCreateBlockDetails([{ id: Date.now(), value: "" }]);
  };

  const openCreateEditBlock = (field, block) => {
    setCreateBlockModal({ open: true, field, editingId: block.id });
    setCreateBlockTitle(block.title || "");
    setCreateBlockDetails(
      block.details && block.details.length > 0
        ? block.details.map((d) => ({ id: d.id || Date.now() + Math.random(), value: d.value || "" }))
        : [{ id: Date.now(), value: "" }]
    );
  };

  const handleSaveCreateBlock = () => {
    const cleanDetails = createBlockDetails.filter((d) => d.value.trim());
    const newBlock = { id: createBlockModal.editingId || Date.now(), title: createBlockTitle.trim(), details: cleanDetails };
    setFormData((prev) => {
      const field = createBlockModal.field;
      const existing = prev[field] || [];
      if (createBlockModal.editingId) {
        return { ...prev, [field]: existing.map((b) => (b.id === createBlockModal.editingId ? newBlock : b)) };
      }
      return { ...prev, [field]: [...existing, newBlock] };
    });
    setCreateBlockModal({ open: false, field: "qualifications", editingId: null });
  };

  const removeCreateBlock = (field, blockId) => {
    setFormData((prev) => ({ ...prev, [field]: (prev[field] || []).filter((b) => b.id !== blockId) }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        className="max-w-4xl"
        title={
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#111A62]" />
            <span>Create Job Posting</span>
          </div>
        }
        description="Review PRF details, set posting information, and edit qualifications or responsibilities before publishing."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
            <Button type="button" variant="primary" onClick={handleSubmit} className="bg-[#111A62] text-white gap-1.5 cursor-pointer">
              <Save size={14} /> Create Posting
            </Button>
          </div>
        }
      >
        <div className="space-y-5 py-2">
          {/* PRF / Job Library Info Summary */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Position</p>
                <p className="truncate text-xs font-bold text-slate-900">{prf.position_needed || prf.job_library?.job_title || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                <p className="truncate text-xs font-bold text-slate-900">{prf.department?.department_name || prf.department?.name || "General"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Salary Range</p>
                <p className="truncate text-xs font-bold text-slate-900">
                  {prf.job_library?.salary_min || prf.job_library?.salary_max 
                    ? `₱${Number(prf.job_library?.salary_min ?? 0).toLocaleString()} – ₱${Number(prf.job_library?.salary_max ?? 0).toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Headcount</p>
                <p className="truncate text-xs font-bold text-slate-900">{prf.headcount} {prf.headcount === 1 ? "position" : "positions"}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                label="Work Location / Setup"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Cebu City, Philippines"
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
          </div>

          <div className="flex flex-col">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <AlignLeft size={16} className="text-slate-400" />
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter a compelling overview of the role..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed outline-none transition resize-none focus:border-[#111A62] focus:ring-2 focus:ring-[#111A62]/20"
            />
          </div>

          {/* Qualifications & Responsibilities Grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-200">
            {/* Qualifications */}
            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <GraduationCap size={16} className="text-slate-400" />
                  Qualifications
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateAddBlock("qualifications")}
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
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {formData.qualifications.map((block) => (
                    <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => openCreateEditBlock("qualifications", block)} className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Edit Block"><Edit size={14} /></button>
                          <button type="button" onClick={() => removeCreateBlock("qualifications", block.id)} className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Delete Block"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                          {block.details.map((detail, idx) => (
                            <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">{detail.value}</li>
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
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <List size={16} className="text-slate-400" />
                  Responsibilities
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateAddBlock("responsibilities")}
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
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {formData.responsibilities.map((block) => (
                    <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => openCreateEditBlock("responsibilities", block)} className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Edit Block"><Edit size={14} /></button>
                          <button type="button" onClick={() => removeCreateBlock("responsibilities", block.id)} className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Delete Block"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                          {block.details.map((detail, idx) => (
                            <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">{detail.value}</li>
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
      </Modal>

      {/* Block Sub-Modal for Create Posting */}
      <Modal
        open={createBlockModal.open}
        containerClassName="z-[110]"
        onClose={() => setCreateBlockModal({ open: false, field: "qualifications", editingId: null })}
        className="max-w-xl"
        title={
          <div className="flex items-center gap-2">
            {createBlockModal.field === "qualifications" ? (
              <GraduationCap className="h-5 w-5 text-blue-600" />
            ) : (
              <List className="h-5 w-5 text-blue-600" />
            )}
            <span>
              {createBlockModal.editingId ? "Edit" : "Add"}{" "}
              {createBlockModal.field === "qualifications" ? "Qualification Block" : "Responsibility Block"}
            </span>
          </div>
        }
        description={
          createBlockModal.field === "qualifications"
            ? "Group qualifications into categories (e.g. Educational Background, Skills) with bullet items."
            : "Group responsibilities into categories (e.g. Core Duties, Reporting) with bullet items."
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateBlockModal({ open: false, field: "qualifications", editingId: null })} className="cursor-pointer">Cancel</Button>
            <Button type="button" variant="primary" onClick={handleSaveCreateBlock} disabled={!createBlockTitle.trim()} className="gap-1.5 cursor-pointer">
              <FileCheck size={16} /><span>Save Block</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileCheck size={14} className="text-slate-400" />
              Category / Block Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={createBlockTitle}
              onChange={(e) => setCreateBlockTitle(e.target.value)}
              placeholder={createBlockModal.field === "qualifications" ? "e.g. Educational Background" : "e.g. Core Duties"}
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <List size={14} className="text-slate-400" />
              Bullet Items
            </label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {createBlockDetails.map((detail, idx) => (
                <div key={detail.id} className="flex items-start gap-2">
                  <span className="mt-2.5 text-xs text-slate-400 font-bold w-5 text-center shrink-0">{idx + 1}.</span>
                  <textarea
                    rows={2}
                    value={detail.value}
                    onChange={(e) => {
                      const updated = [...createBlockDetails];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      setCreateBlockDetails(updated);
                    }}
                    placeholder="Enter detail..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed outline-none transition resize-none focus:border-[#111A62] focus:ring-2 focus:ring-[#111A62]/20"
                  />
                  {createBlockDetails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCreateBlockDetails(createBlockDetails.filter((d) => d.id !== detail.id))}
                      className="mt-2 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCreateBlockDetails([...createBlockDetails, { id: Date.now(), value: "" }])}
                className="flex items-center gap-1 text-xs font-semibold text-[#111A62] hover:text-[#0d1449] transition-colors cursor-pointer mt-1"
              >
                <Plus size={14} /> Add Another Item
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
