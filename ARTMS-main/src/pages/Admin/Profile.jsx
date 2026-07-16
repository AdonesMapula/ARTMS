import { useState } from "react";
import { FiUser, FiMail, FiBriefcase, FiPhone, FiShield, FiCheck } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "HR";

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Account</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">View and update your account details.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Avatar card */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--artms-primary)] text-3xl font-extrabold text-white">
              {initials}
            </div>
            <div className="text-center">
              <p className="text-base font-extrabold text-slate-900">{user?.name ?? "HR Administrator"}</p>
              <p className="text-sm text-slate-500">{user?.email ?? "admin@artms.com"}</p>
              <Badge tone="info" className="mt-2 capitalize">{user?.role?.replace(/_/g, " ") ?? "hr admin"}</Badge>
            </div>
            {user?.employee_id && (
              <div className="w-full rounded-xl bg-slate-50 px-4 py-2 text-center">
                <p className="text-xs font-bold text-slate-400">Employee ID</p>
                <p className="text-sm font-extrabold text-slate-900">{user.employee_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <Field icon={<FiUser />}      label="Full Name"    defaultValue={user?.name ?? ""} />
              <Field icon={<FiMail />}      label="Email"        defaultValue={user?.email ?? ""} type="email" />
              <Field icon={<FiBriefcase />} label="Department"   defaultValue={user?.department?.department_name ?? "Human Resources"} />
              <Field icon={<FiPhone />}     label="Phone"        defaultValue="+63 9XX XXX XXXX" />

              {/* Security info */}
              <div className="sm:col-span-2 rounded-xl border border-[var(--artms-border)] bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiShield className="text-slate-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Security</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-white border border-[var(--artms-border)] px-3 py-2">
                    <span className="text-xs font-semibold text-slate-700">Password</span>
                    <Badge tone="default">••••••••</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white border border-[var(--artms-border)] px-3 py-2">
                    <span className="text-xs font-semibold text-slate-700">Last Login</span>
                    <Badge tone="info">{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Today"}</Badge>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-3">
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                    <FiCheck /> Saved successfully
                  </span>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--artms-primary)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--artms-primary-2)] transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ icon, label, defaultValue, type = "text" }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="relative flex items-center rounded-xl border border-[var(--artms-border)] bg-white focus-within:border-[var(--artms-primary)] focus-within:ring-2 focus-within:ring-[var(--artms-primary)]/20">
        <span className="absolute left-3 text-slate-400 text-sm">{icon}</span>
        <input
          type={type}
          defaultValue={defaultValue}
          className="w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:outline-none"
        />
      </div>
    </div>
  );
}
