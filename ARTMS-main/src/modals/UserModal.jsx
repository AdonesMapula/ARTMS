import { useEffect, useState } from "react";
import { User, Mail, Lock, Shield, Building2, Plus, Check, KeyRound, Copy, Eye, EyeOff, ShieldCheck, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
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
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "hr_admin",
    department_id: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [emailStatus, setEmailStatus] = useState("empty");
  
  // Post-creation temporary password display state for HR
  const [createdPasswordData, setCreatedPasswordData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setCreatedPasswordData(null);
      setShowPassword(false);
      setCopied(false);
      
      if (editUser) {
        // Split name into parts if it exists
        const nameParts = (editUser.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

        setForm({
          first_name: editUser.first_name || firstName,
          middle_name: editUser.middle_name || middleName,
          last_name: editUser.last_name || lastName,
          email: editUser.email || "",
          password: "",
          password_confirmation: "",
          role: editUser.role || "hr_admin",
          department_id: editUser.department_id ? String(editUser.department_id) : "",
        });
      } else {
        setForm({
          first_name: "",
          middle_name: "",
          last_name: "",
          email: "",
          password: "",
          password_confirmation: "",
          role: "hr_admin",
          department_id: "",
        });
      }
      setErrors({});
      setEmailStatus("empty");
    }
  }, [open, editUser]);

  const handleClose = () => {
    setCreatedPasswordData(null);
    onClose();
  };

  const handleCopyPassword = () => {
    if (createdPasswordData?.password) {
      navigator.clipboard.writeText(createdPasswordData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async () => {
    // Client-side validation
    const validationErrors = {};
    if (!form.first_name.trim()) validationErrors.first_name = ["First name is required."];
    if (!form.last_name.trim())  validationErrors.last_name  = ["Last name is required."];
    if (!form.email.trim())      validationErrors.email       = ["Email address is required."];
    
    if (editUser) {
      const cleanPw = (form.password || "").trim();
      const cleanCpw = (form.password_confirmation || "").trim();
      if (cleanPw && cleanPw.length < 8) {
        validationErrors.password = ["Password must be at least 8 characters."];
      }
      if (cleanPw && cleanPw !== cleanCpw) {
        validationErrors.password_confirmation = ["Passwords do not match."];
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const sanitizedForm = {
        ...form,
        first_name: form.first_name.trim(),
        middle_name: form.middle_name?.trim() || "",
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password?.trim() || "",
        password_confirmation: form.password_confirmation?.trim() || "",
      };
      const res = await onSave(sanitizedForm);
      const data = res?.data || res;
      
      if (!editUser && data?.temporary_password) {
        setCreatedPasswordData({
          password: data.temporary_password,
          emailSent: data.email_sent ?? true,
          emailError: data.email_error,
          email: form.email,
          name: [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" "),
        });
      } else {
        handleClose();
      }
    } catch (err) {
      console.error('Save error:', err);
      const backendErrors = err.response?.data?.errors;
      const message = err.response?.data?.message;
      
      // Handle validation errors
      if (backendErrors) {
        setErrors(backendErrors);
      } else if (message) {
        setErrors({ general: message });
      } else {
        setErrors({ general: "Save failed. Please try again." });
      }
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

  // Render Post-Creation Success / Password Display Screen
  if (createdPasswordData) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        className="max-w-lg"
        title="User Created Successfully"
        description="The new account has been generated and credentials sent."
        footer={
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleClose}>
              Done & Close
            </Button>
          </div>
        }
      >
        <div className="space-y-5 py-1">
          {/* Header Badge */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-base">{createdPasswordData.name}</p>
              <p className="text-xs text-emerald-700 font-medium">{createdPasswordData.email}</p>
            </div>
          </div>

          {/* Temporary Password Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Autogenerated Temporary Password</span>
              <span className="text-[11px] font-medium text-slate-400">Share with user if needed</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex flex-1 items-center rounded-xl border border-slate-300 bg-white px-3.5 py-3 shadow-inner">
                <span className="font-mono text-base font-bold tracking-wider text-slate-900 select-all">
                  {showPassword ? createdPasswordData.password : "•".repeat(createdPasswordData.password.length || 10)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button
                variant={copied ? "success" : "outline"}
                onClick={handleCopyPassword}
                className="h-12 px-4 whitespace-nowrap gap-1.5"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Email Delivery Status Notice */}
          <div className={`rounded-xl border p-4 text-xs ${
            createdPasswordData.emailSent
              ? "border-blue-200 bg-blue-50/80 text-blue-900"
              : "border-amber-200 bg-amber-50/80 text-amber-900"
          }`}>
            <div className="flex items-start gap-2.5">
              {createdPasswordData.emailSent ? (
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <div className="leading-relaxed">
                {createdPasswordData.emailSent ? (
                  <>
                    <p className="font-bold text-blue-950">Email Link Delivered Successfully</p>
                    <p className="mt-0.5 text-blue-800">
                      An activation email containing this password and a secure link has been sent to <strong>{createdPasswordData.email}</strong>. The user can click the link to set up their custom password.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-amber-950">Email Delivery Warning</p>
                    <p className="mt-0.5 text-amber-800">
                      Account created, but the welcome email could not be delivered directly ({createdPasswordData.emailError || "SMTP issue"}). Please provide the password above directly to the user.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="max-w-2xl"
      title={editUser ? "Edit User" : "Create New User"}
      description={
        editUser
          ? "Update user information and permissions"
          : "Add a new user to the system"
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : editUser ? "Update User" : "Create User"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {errors.general && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        {errors.name && (
          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-600">
            <strong>Duplicate Name Warning:</strong> {errors.name}
          </div>
        )}

        <div className="space-y-4">
          {/* Name Fields */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User size={14} className="text-slate-400" />
                First Name
              </label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="First name"
                error={errors.first_name?.[0]}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User size={14} className="text-slate-400" />
                Middle Name
              </label>
              <Input
                value={form.middle_name}
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                placeholder="Middle name (optional)"
                error={errors.middle_name?.[0]}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User size={14} className="text-slate-400" />
                Last Name
              </label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Last name"
                error={errors.last_name?.[0]}
              />
            </div>
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
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, email: val });
                
                if (!val) {
                  setEmailStatus("empty");
                } else {
                  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                  setEmailStatus(emailRegex.test(val) ? "valid" : "invalid");
                }
                
                // Clear errors on typing
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: null }));
                }
              }}
              placeholder="user@example.com"
              error={errors.email?.[0]}
              inputClassName={
                emailStatus === 'valid'
                  ? "!border-emerald-400 focus:!border-emerald-500 focus:!ring-emerald-200"
                  : emailStatus === 'invalid'
                  ? "!border-rose-400 focus:!border-rose-500 focus:!ring-rose-200 text-rose-600"
                  : ""
              }
            />
            <div className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${emailStatus === 'empty' && !errors.email ? 'h-0 opacity-0' : 'h-6 opacity-100'}`}>
              {emailStatus === 'valid' && !errors.email && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 transition-all">
                  <CheckCircle2 size={14} className="animate-in zoom-in" /> 
                  <span className="animate-in fade-in slide-in-from-left-2 duration-300">Valid email format</span>
                </div>
              )}
              {emailStatus === 'invalid' && !errors.email && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 transition-all">
                  <AlertCircle size={14} className="animate-pulse" /> 
                  <span className="animate-in fade-in slide-in-from-left-2 duration-300">Invalid email format</span>
                </div>
              )}
            </div>
          </div>

          {/* Password Notice / Section */}
          {!editUser ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-950">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#111A62]" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-[#111A62]">Autogenerated Password & Email Notice</p>
                  <p className="mt-1 leading-relaxed text-slate-600">
                    The password will be automatically generated and emailed directly to{" "}
                    <strong className="text-slate-800">{form.email || "the registered email address"}</strong> along with a link to access the website and set up their custom password. You will also be able to view and copy the generated password once created.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Lock size={14} className="text-slate-400" />
                  New Password (Optional)
                </label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to keep current"
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
                  error={errors.password_confirmation?.[0]}
                />
              </div>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Shield size={14} className="text-slate-400" />
              Role
            </label>
            <div className="flex items-start gap-2">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={roleOptions}
                error={errors.role?.[0]}
              />
              {onCreateRole && (
                <button
                  type="button"
                  onClick={onCreateRole}
                  className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#111A62] bg-transparent px-3 text-sm font-semibold text-[#111A62] transition-all duration-200 hover:bg-[#111A62]/5 active:scale-95"
                  title="Add new role"
                >
                  <Plus size={16} />
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Building2 size={14} className="text-slate-400" />
              Department
            </label>
            <div className="flex items-start gap-2">
              <Select
                value={String(form.department_id)}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                options={departmentOptions}
              />
              {onCreateDepartment && (
                <button
                  type="button"
                  onClick={onCreateDepartment}
                  className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#111A62] bg-transparent px-3 text-sm font-semibold text-[#111A62] transition-all duration-200 hover:bg-[#111A62]/5 active:scale-95"
                  title="Add new department"
                >
                  <Plus size={16} />
                  Add
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Optional - Assign user to a specific department
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
