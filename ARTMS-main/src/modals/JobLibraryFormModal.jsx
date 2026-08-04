import { FileText, Hash, DollarSign, Briefcase, List, FileCheck, Plus, Trash2, GraduationCap, X, AlertTriangle, XCircle } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

/**
 * JobLibraryFormModal - Create or Edit Job Library Entry
 */
export default function JobLibraryFormModal({
  open,
  mode,
  data,
  form,
  setForm,
  onClose,
  onSave,
  saving = false,
}) {
  const isRejected = mode === "edit" && data?.approval_status === "rejected";
  const remarksText = data?.approval_remarks || data?.remarks;

  const qualBlocks = Array.isArray(form.qualifications) ? form.qualifications : [];
  const respBlocks = Array.isArray(form.responsibilities) ? form.responsibilities : [];

  const addBlock = (field, blocks) => {
    setForm({
      ...form,
      [field]: [
        ...blocks,
        { id: Date.now(), title: "", details: [] }
      ]
    });
  };

  const updateBlock = (field, blocks, id, value) => {
    setForm({
      ...form,
      [field]: blocks.map(b => b.id === id ? { ...b, title: value } : b)
    });
  };

  const removeBlock = (field, blocks, id) => {
    setForm({
      ...form,
      [field]: blocks.filter(b => b.id !== id)
    });
  };

  const addDetail = (field, blocks, blockId) => {
    setForm({
      ...form,
      [field]: blocks.map(b => 
        b.id === blockId 
          ? { ...b, details: [...b.details, { id: Date.now() + Math.random(), value: "" }] }
          : b
      )
    });
  };

  const updateDetail = (field, blocks, blockId, detailId, value) => {
    setForm({
      ...form,
      [field]: blocks.map(b => 
        b.id === blockId 
          ? {
              ...b,
              details: b.details.map(d => d.id === detailId ? { ...d, value } : d)
            }
          : b
      )
    });
  };

  const removeDetail = (field, blocks, blockId, detailId) => {
    setForm({
      ...form,
      [field]: blocks.map(b => 
        b.id === blockId 
          ? {
              ...b,
              details: b.details.filter(d => d.id !== detailId)
            }
          : b
      )
    });
  };

  if (!open) return null;

  return (
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
          <Button variant={isRejected ? "primary" : "primary"} onClick={onSave} disabled={saving} className={isRejected ? "bg-red-600 hover:bg-red-700 font-bold" : ""}>
            {saving
              ? "Saving..."
              : isRejected
              ? "Revise & Resubmit to COO"
              : mode === "create"
              ? "Submit for Approval"
              : "Save Changes"}
          </Button>
        </div>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6">
          {/* COO Feedback Banner for Rejected Entries */}
          {isRejected && remarksText && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-amber-50/60 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
                  <XCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    COO Rejection Feedback & Revision Instructions
                  </h4>
                  <p className="mt-1 text-sm font-medium text-red-800 whitespace-pre-wrap">
                    "{remarksText}"
                  </p>
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    💡 Modify the qualifications, responsibilities, or details below to address the COO's feedback, then click "Revise & Resubmit to COO".
                  </p>
                </div>
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
                  <Input
                    value={form.job_category}
                    onChange={(e) => setForm({ ...form, job_category: e.target.value })}
                    placeholder="e.g., Operations, IT, Finance"
                  />
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

              {/* Salary Range */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <DollarSign size={14} className="text-slate-400" />
                    Salary Min (₱)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form.salary_min}
                    onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                    placeholder="e.g., 20000"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <DollarSign size={14} className="text-slate-400" />
                    Salary Max (₱)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form.salary_max}
                    onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                    placeholder="e.g., 35000"
                  />
                </div>
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
                      <GraduationCap size={14} className="text-slate-400" />
                      Qualifications <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock("qualifications", qualBlocks)}
                      className="h-8 gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      <Plus size={14} /> Add Block
                    </Button>
                  </div>
                  
                  {qualBlocks.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No qualifications added.</p>
                  ) : (
                    <div className="space-y-4">
                      {qualBlocks.map((block) => (
                        <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. Educational Background"
                              value={block.title}
                              onChange={(e) => updateBlock("qualifications", qualBlocks, block.id, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => removeBlock("qualifications", qualBlocks, block.id)}
                              className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-2"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          
                          <div className="mt-3 pl-6 border-l-2 border-slate-100 space-y-2">
                            {block.details.map((detail) => (
                              <div key={detail.id} className="flex gap-2">
                                <Input
                                  placeholder="Specific detail..."
                                  value={detail.value}
                                  onChange={(e) => updateDetail("qualifications", qualBlocks, block.id, detail.id, e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDetail("qualifications", qualBlocks, block.id, detail.id)}
                                  className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-1.5"
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addDetail("qualifications", qualBlocks, block.id)}
                              className="mt-2 h-7 gap-1 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              <Plus size={12} /> Add Detail
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Responsibilities */}
                <div className="flex flex-col h-full sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <List size={14} className="text-slate-400" />
                      Responsibilities <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock("responsibilities", respBlocks)}
                      className="h-8 gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      <Plus size={14} /> Add Block
                    </Button>
                  </div>
                  
                  {respBlocks.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No responsibilities added.</p>
                  ) : (
                    <div className="space-y-4">
                      {respBlocks.map((block) => (
                        <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. Core Duties"
                              value={block.title}
                              onChange={(e) => updateBlock("responsibilities", respBlocks, block.id, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => removeBlock("responsibilities", respBlocks, block.id)}
                              className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-2"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          
                          <div className="mt-3 pl-6 border-l-2 border-slate-100 space-y-2">
                            {block.details.map((detail) => (
                              <div key={detail.id} className="flex gap-2">
                                <Input
                                  placeholder="Specific responsibility task..."
                                  value={detail.value}
                                  onChange={(e) => updateDetail("responsibilities", respBlocks, block.id, detail.id, e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDetail("responsibilities", respBlocks, block.id, detail.id)}
                                  className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-1.5"
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addDetail("responsibilities", respBlocks, block.id)}
                              className="mt-2 h-7 gap-1 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              <Plus size={12} /> Add Detail
                            </Button>
                          </div>
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
  );
}
