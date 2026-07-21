import { useState } from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

const inputClass =
  "w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]";
const textareaClass = `${inputClass} resize-none`;
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800";

/**
 * JobLibraryFormModal - Create or Edit Job Library Entry
 * 
 * @param {boolean} open - Modal visibility
 * @param {string} mode - "create" or "edit"
 * @param {object} data - Job data (for edit mode)
 * @param {object} form - Form state
 * @param {function} setForm - Form state setter
 * @param {function} onClose - Close callback
 * @param {function} onSave - Save callback
 * @param {boolean} saving - Loading state
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
  return (
    <Modal
      open={open}
      title={mode === "create" ? "Add Job Entry" : "Edit Job Entry"}
      description={
        mode === "create"
          ? "New entries require COO approval before they appear in PRF dropdowns."
          : `Editing JL-${String(data?.id ?? 0).padStart(3, "0")}`
      }
      onClose={onClose}
      className="max-w-4xl" // Larger modal
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <FiX /> Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={onSave} disabled={saving}>
            <FiCheckCircle />{" "}
            {saving ? "Saving…" : mode === "create" ? "Submit for Approval" : "Save Changes"}
          </Button>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
        {/* Basic Info */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Basic Information
          </p>
          <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g., Customer Service Representative"
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Job Category</label>
                <input
                  className={inputClass}
                  placeholder="e.g., Operations, IT, Finance"
                  value={form.job_category}
                  onChange={(e) => setForm({ ...form, job_category: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Employment Type</label>
                <select
                  className={inputClass}
                  value={form.employment_type}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contractual">Contractual</option>
                  <option value="project_based">Project-based</option>
                  <option value="probationary">Probationary</option>
                  <option value="ojt">OJT / Internship</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Salary Min (₱)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="e.g., 20000"
                  value={form.salary_min}
                  onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Salary Max (₱)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="e.g., 35000"
                  value={form.salary_max}
                  onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Job Details
          </p>
          <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-5 space-y-4">
            <div>
              <label className={labelClass}>
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className={textareaClass}
                placeholder="Brief overview of the role and its purpose…"
                value={form.job_description}
                onChange={(e) => setForm({ ...form, job_description: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>
                Qualifications <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className={textareaClass}
                placeholder="Educational background, experience, skills required…"
                value={form.qualifications}
                onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                This will auto-populate Steps 3 &amp; 4 in the PRF when this job is selected.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Responsibilities <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className={textareaClass}
                placeholder="Key duties and tasks for this role…"
                value={form.responsibilities}
                onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
