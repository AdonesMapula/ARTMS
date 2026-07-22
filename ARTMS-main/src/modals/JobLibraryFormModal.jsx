import { FileText, Hash, DollarSign, Briefcase, List, FileCheck } from "lucide-react";
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
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {mode === "create" ? "Add Job Entry" : "Edit Job Entry"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "create"
                ? "New entries require COO approval before appearing in PRF dropdowns"
                : `Editing JL-${String(data?.id ?? 0).padStart(3, "0")}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="px-6 py-5"
        style={{ maxHeight: "calc(80vh - 180px)", overflowY: "auto" }}
      >
        <div className="space-y-6">
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

              {/* Qualifications */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileCheck size={14} className="text-slate-400" />
                  Qualifications <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Educational background, experience, skills required..."
                  value={form.qualifications}
                  onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  This will auto-populate Steps 3 & 4 in the PRF when this job is selected.
                </p>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <List size={14} className="text-slate-400" />
                  Responsibilities <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Key duties and tasks for this role..."
                  value={form.responsibilities}
                  onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                />
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
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving
              ? "Saving..."
              : mode === "create"
              ? "Submit for Approval"
              : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
