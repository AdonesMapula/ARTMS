import { useEffect, useState } from "react";
import { Building2, Hash, User } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

export default function DepartmentModal({ open, editDept, onClose, onSave }) {
  const [form, setForm] = useState({
    department_name: "",
    department_code: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editDept) {
        setForm({
          department_name: editDept.department_name || "",
          department_code: editDept.department_code || "",
          is_active: editDept.is_active ?? true,
        });
      } else {
        setForm({
          department_name: "",
          department_code: "",
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [open, editDept]);

  const handleSubmit = async () => {
    setSaving(true);
    setErrors({});
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErrors(
        err.response?.data?.errors ?? {
          general: err.response?.data?.message ?? "Save failed.",
        }
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          {editDept ? "Edit Department" : "Create New Department"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {editDept
            ? "Update department information and settings"
            : "Add a new department to the organization"}
        </p>
      </div>

      {/* Content */}
      <div
        className="px-6 py-5"
        style={{ maxHeight: "calc(80vh - 180px)", overflowY: "auto" }}
      >
        {errors.general && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <div className="space-y-4">
          {/* Department Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Building2 size={14} className="text-slate-400" />
              Department Name
            </label>
            <Input
              value={form.department_name}
              onChange={(e) => setForm({ ...form, department_name: e.target.value })}
              placeholder="e.g., Human Resources, IT Department"
              error={errors.department_name?.[0]}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              The official name of the department
            </p>
          </div>

          {/* Department Code */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Hash size={14} className="text-slate-400" />
              Department Code (Optional)
            </label>
            <Input
              value={form.department_code}
              onChange={(e) =>
                setForm({ ...form, department_code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., HR, IT, FIN, OPS"
              error={errors.department_code?.[0]}
              maxLength={10}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Short code for reports and identification (max 10 characters)
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User size={14} className="text-slate-400" />
              Status
            </label>
            <Select
              value={form.is_active ? "1" : "0"}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}
              options={[
                { value: "1", label: "Active - Department is operational" },
                { value: "0", label: "Inactive - Department is not operational" },
              ]}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Inactive departments are hidden from most selections
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-900">
              💡 Department Information
            </p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>• Staff members can be assigned to this department</li>
              <li>• Department heads can be designated in User Management</li>
              <li>• Staff count is calculated automatically</li>
              <li>• Departments with staff cannot be deleted</li>
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
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : editDept ? "Update Department" : "Create Department"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
