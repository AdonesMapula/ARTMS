import { useEffect, useState } from "react";
import { User, Mail, Lock, Shield, Building2, Plus, Check } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

const ROLES = [
  { value: "hr_admin", label: "HR Admin" },
  { value: "coo", label: "COO" },
  { value: "department_head", label: "Department Head" },
  { value: "employee", label: "Employee" },
];

export default function UserModal({
  open,
  editUser,
  departments,
  roles,
  onClose,
  onSave,
  onCreateRole,
  onCreateDepartment,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "hr_admin",
    department_id: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editUser) {
        setForm({
          name: editUser.name || "",
          email: editUser.email || "",
          password: "",
          password_confirmation: "",
          role: editUser.role || "hr_admin",
          department_id: editUser.department_id ? String(editUser.department_id) : "",
        });
      } else {
        setForm({
          name: "",
          email: "",
          password: "",
          password_confirmation: "",
          role: "hr_admin",
          department_id: "",
        });
      }
      setErrors({});
    }
  }, [open, editUser]);

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

  // Combine custom roles with default roles
  const roleOptions = roles && roles.length > 0 
    ? roles.map(r => ({ value: r.key || r.value, label: r.name || r.label }))
    : ROLES;

  const departmentOptions = [
    { value: "", label: "No department" },
    ...departments.map((d) => ({ value: String(d.id), label: d.department_name })),
  ];

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          {editUser ? "Edit User" : "Create New User"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {editUser
            ? "Update user information and permissions"
            : "Add a new user to the system"}
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
          {/* Full Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User size={14} className="text-slate-400" />
              Full Name
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              error={errors.name?.[0]}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail size={14} className="text-slate-400" />
              Email Address
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@example.com"
              error={errors.email?.[0]}
            />
          </div>

          {/* Password Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Lock size={14} className="text-slate-400" />
                {editUser ? "New Password" : "Password"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editUser ? "Leave blank to keep current" : "••••••••"}
                error={errors.password?.[0]}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Check size={14} className="text-slate-400" />
                Confirm Password
              </label>
              <Input
                type="password"
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm({ ...form, password_confirmation: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Shield size={14} className="text-slate-400" />
                Role
              </label>
              {onCreateRole && (
                <button
                  onClick={onCreateRole}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#111A62] transition hover:bg-blue-50"
                >
                  <Plus size={12} />
                  Add Role
                </button>
              )}
            </div>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={roleOptions}
              error={errors.role?.[0]}
            />
          </div>

          {/* Department */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Building2 size={14} className="text-slate-400" />
                Department
              </label>
              {onCreateDepartment && (
                <button
                  onClick={onCreateDepartment}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#111A62] transition hover:bg-blue-50"
                >
                  <Plus size={12} />
                  Add Department
                </button>
              )}
            </div>
            <Select
              value={String(form.department_id)}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              options={departmentOptions}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Optional - Assign user to a specific department
            </p>
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
            {saving ? "Saving..." : editUser ? "Update User" : "Create User"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
