import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import AlertModal from "../../components/ui/AlertModal";

const roles = [
  { id: "R-SA", name: "Super Admin", permissions: 42, scope: "All" },
  { id: "R-HR", name: "HR Admin", permissions: 28, scope: "Recruitment" },
  { id: "R-DH", name: "Department Head", permissions: 12, scope: "Requests" },
];

export default function Roles() {
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });

  const showAlert = (variant, title, message) =>
    setAlert({ open: true, variant, title, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Security
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Role & Permission Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Define roles and access controls for modules (UI only).
          </p>
        </div>
        <Badge tone="info">Placeholder</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Roles</CardTitle>
            <Button
              variant="accent"
              onClick={() =>
                showAlert(
                  "info",
                  "Coming Soon",
                  "Role creation is not yet implemented. This feature is planned for a future release."
                )
              }
            >
              Create role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>ID</TH>
                <TH>Role</TH>
                <TH>Permissions</TH>
                <TH>Scope</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">{r.id}</TD>
                  <TD>{r.name}</TD>
                  <TD>
                    <Badge tone="info">{r.permissions}</Badge>
                  </TD>
                  <TD>{r.scope}</TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          showAlert(
                            "info",
                            "Coming Soon",
                            `Permission management for "${r.name}" is not yet implemented.`
                          )
                        }
                      >
                        Permissions
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          showAlert(
                            "info",
                            "Coming Soon",
                            `Editing the "${r.name}" role is not yet implemented.`
                          )
                        }
                      >
                        Edit
                      </Button>
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <AlertModal
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />
    </div>
  );
}
