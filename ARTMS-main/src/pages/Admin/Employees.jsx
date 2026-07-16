import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import { useState } from "react";

const employees = [
  { id: "EMP-2001", name: "Taylor Reyes", dept: "Operations", role: "Team Lead", status: "Active" },
  { id: "EMP-2002", name: "Morgan Lee", dept: "Human Resources", role: "HR Generalist", status: "Active" },
  { id: "EMP-2003", name: "Casey Tan", dept: "IT", role: "Service Desk", status: "Onboarding" },
];

export default function Employees() {
  const [q, setQ] = useState("");
  const rows = employees.filter((e) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      e.name.toLowerCase().includes(query) ||
      e.dept.toLowerCase().includes(query) ||
      e.role.toLowerCase().includes(query) ||
      e.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Workforce
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Employee Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder employee records for future HRIS integration.
          </p>
        </div>
        <Badge tone="info">UI only</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Employees</CardTitle>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="w-full sm:w-80">
                <SearchBar value={q} onChange={setQ} placeholder="Search employees…" />
              </div>
              <Button variant="accent" onClick={() => alert("Placeholder: add employee (UI only).")}>
                Add employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Employee</TH>
                <TH>Department</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">
                    {e.name}
                    <div className="text-xs font-medium text-slate-500">{e.id}</div>
                  </TD>
                  <TD>{e.dept}</TD>
                  <TD>{e.role}</TD>
                  <TD>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {e.status}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <Button size="sm" variant="outline" onClick={() => alert("Placeholder: view employee (UI only).")}>
                      View
                    </Button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

