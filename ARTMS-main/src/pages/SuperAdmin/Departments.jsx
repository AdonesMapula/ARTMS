import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Input from "../../components/ui/Input";
import Skeleton from "../../components/ui/Skeleton";
import departmentService from "../../services/departmentService";

export default function Departments() {
  const [depts, setDepts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept]   = useState(null);
  const [form, setForm]           = useState({ department_name: "", description: "" });
  const [formErr, setFormErr]     = useState({});
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [apiErr, setApiErr]       = useState("");

  const load = () => {
    setLoading(true);
    departmentService.getAll()
      .then(r => setDepts(r.data.departments ?? r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditDept(null);
    setForm({ department_name: "", description: "" });
    setFormErr({}); setApiErr("");
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditDept(d);
    setForm({ department_name: d.department_name, description: d.description ?? "" });
    setFormErr({}); setApiErr("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormErr({}); setApiErr("");
    try {
      editDept
        ? await departmentService.update(editDept.id, form)
        : await departmentService.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      if (err.response?.data?.errors) setFormErr(err.response.data.errors);
      else setApiErr(err.response?.data?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await departmentService.delete(deleteId);
      load();
    } catch (err) {
      setApiErr(err.response?.data?.message ?? "Delete failed.");
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = depts.filter(d => {
    if (!q.trim()) return true;
    return d.department_name?.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Organization</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Department Management</h1>
          <p className="mt-1 text-sm text-slate-500">Maintain departments and reporting structure.</p>
        </div>
        <Button variant="accent" onClick={openCreate}>+ Add Department</Button>
      </div>

      {apiErr && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{apiErr}</p>}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Departments</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar value={q} onChange={setQ} placeholder="Search departments…" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No departments found.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>#</TH>
                  <TH>Name</TH>
                  <TH>Description</TH>
                  <TH>Staff</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </THead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <TD className="font-semibold text-slate-900">{d.id}</TD>
                    <TD className="font-semibold">{d.department_name}</TD>
                    <TD className="max-w-xs truncate text-slate-500">{d.description ?? "—"}</TD>
                    <TD>{d.employees_count ?? "—"}</TD>
                    <TD><Badge tone={d.is_active ? "success" : "default"}>{d.is_active ? "Active" : "Inactive"}</Badge></TD>
                    <TD className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(d)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteId(d.id)}>Delete</Button>
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
        title={editDept ? "Edit Department" : "Add Department"}
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
          {apiErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{apiErr}</p>}
          <Input
            label="Department Name" value={form.department_name}
            onChange={e => setForm(f => ({ ...f, department_name: e.target.value }))}
            error={formErr.department_name?.[0]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Description</label>
            <textarea
              className="w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--artms-ring)]"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete department?"
        description="This cannot be undone. Departments with active employees cannot be deleted."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
