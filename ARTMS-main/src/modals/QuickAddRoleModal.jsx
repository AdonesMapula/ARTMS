import { useState } from "react";
import { Shield, Plus } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function QuickAddRoleModal({ open, onClose, onAdd }) {
  const [roleName, setRoleName] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!roleName.trim() || !roleKey.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onAdd({ name: roleName, key: roleKey });
      setRoleName("");
      setRoleKey("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add role");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setRoleName("");
    setRoleKey("");
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="max-w-md"
      title="Add New Role"
      description="Create a custom user role"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving} className="gap-1.5">
            <Plus size={14} />
            {saving ? "Adding..." : "Add Role"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Role Display Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g., Manager, Supervisor"
          />
          <Input
            label="Role Key"
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
            placeholder="e.g., manager, supervisor"
            hint="Lowercase, use underscores for spaces"
          />
        </div>
      </div>
    </Modal>
  );
}
