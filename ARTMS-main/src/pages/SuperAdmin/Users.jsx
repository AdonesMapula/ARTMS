import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Skeleton from "../../components/ui/Skeleton";
import userService from "../../services/userService";
import departmentService from "../../services/departmentService";

const ROLES = [
  { value: "hr_admin",        label: "HR Admin" },
  { value: "coo",             label: "COO" },
  { value: "department_head", label: "Department Head" },
  { value: "employee",        label: "Employee" },
];

const ROLE_TONE = {
  super_admin:     "danger",
  hr_admin:        "info",
  coo:             "accent",
  department_head: "warning",
  employee:        "default",
};

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [depts, setDepts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [confirmId, setConfirmId]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState({});
  const [form, setForm]             = useState({ name: "", email: "", password: "", password_confirmation: "", role: "hr_admin", department_id: "" });

  const load = () => {
    setLoading(true);
    Promise.all([userService.getAll(), departmentService.getAll()])
      .then(([uRes, dRes]) => {
        setUsers(uRes.data.data ?? uRes.data);
        setDepts(dRes.data.departments ?? dRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: "", email: "", password: "", password_confirmation: "", role: "hr_admin", department_id: "" });
    setFormErr({});
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: "", password_confirmation: "", role: u.role, department_id: u.department_id ?? "" });
    setFormErr({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormErr({});
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, department_id: form.department_id || null };
        if (form.password) { payload.password = form.password; payload.password_confirmation = form.password_confirmation; }
        await userService.update(editUser.id, payload);
      } else {
        await userService.create({ ...form, department_id: form.department_id || null });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormErr(err.response?.data?.errors ?? { general: err.response?.data?.message ?? "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    await userService.toggleStatus(id);
    load();
  };

  const filtered = users.filter(u => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.role?.toLowerCase().includes(s);
  });

  const deptOptions = [{ value: "", label: "No department" }, ...depts.map(d => ({ value: String(d.id), label: d.department_name }))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Administration</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage HR Admin, COO, and Department Head accounts.</p>
        </div>
        <Button variant="accent" onClick={openCreate}>+ Create User</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Users</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar value={q} onChange={setQ} placeholder="Search users…" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No users found.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Department</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </THead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <TD className="font-semibold text-slate-900">
                      {u.name}
                      {u.employee_id && <div className="text-xs text-slate-400">{u.employee_id}</div>}
                    </TD>
                    <TD>{u.email}</TD>
                    <TD><Badge tone={ROLE_TONE[u.role] ?? "default"}>{u.role?.replace(/_/g, " ")}</Badge></TD>
                    <TD>{u.department?.department_name ?? <span className="text-slate-400">—</span>}</TD>
                    <TD><Badge tone={u.is_active ? "success" : "default"}>{u.is_active ? "Active" : "Inactive"}</Badge></TD>
                    <TD className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Edit</Button>
                        <Button size="sm" variant={u.is_active ? "danger" : "primary"} onClick={() => setConfirmId(u.id)}>
                          {u.is_active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editUser ? "Edit User" : "Create User"}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          {formErr.general && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formErr.general}</p>}
          <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={formErr.name?.[0]} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={formErr.email?.[0]} />
          <Input label={editUser ? "New Password (leave blank to keep)" : "Password"} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} error={formErr.password?.[0]} />
          <Input label="Confirm Password" type="password" value={form.password_confirmation} onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))} />
          <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} options={ROLES} error={formErr.role?.[0]} />
          <Select label="Department" value={String(form.department_id)} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} options={deptOptions} />
        </div>
      </Modal>

      {/* Toggle status confirm */}
      <ConfirmDialog
        open={!!confirmId}
        title="Change account status?"
        description="This will enable or disable the selected user account."
        confirmLabel="Confirm"
        onConfirm={() => { handleToggle(confirmId); setConfirmId(null); }}
        onClose={() => setConfirmId(null)}
      />
    </div>
  );
}
