import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function QuickAddDepartmentModal({ open, onClose, onAdd }) {
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!deptName.trim()) {
      setError("Department name is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onAdd({
        department_name: deptName,
        department_code: deptCode || null,
      });
      setDeptName("");
      setDeptCode("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add department");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDeptName("");
    setDeptCode("");
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} className="max-w-md">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Add New Department</h2>
            <p className="text-xs text-slate-500">Create a new department</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Department Name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="e.g., Human Resources, IT Department"
          />
          <Input
            label="Department Code (Optional)"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
            placeholder="e.g., HR, IT, FIN"
            hint="Short code for the department"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving} className="gap-1.5">
            <Plus size={14} />
            {saving ? "Adding..." : "Add Department"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
