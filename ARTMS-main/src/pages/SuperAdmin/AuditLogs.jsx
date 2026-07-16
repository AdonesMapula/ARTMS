import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";

const logs = [
  { id: "AL-9001", actor: "superadmin@company.com", action: "Created user", target: "hradmin1@company.com", ip: "10.0.0.2", time: "2026-07-09 16:20" },
  { id: "AL-9002", actor: "superadmin@company.com", action: "Updated role", target: "HR Admin", ip: "10.0.0.2", time: "2026-07-09 12:05" },
  { id: "AL-9003", actor: "superadmin@company.com", action: "Department updated", target: "Operations", ip: "10.0.0.2", time: "2026-07-08 09:31" },
];

export default function AuditLogs() {
  const [q, setQ] = useState("");
  const rows = logs.filter((l) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      l.id.toLowerCase().includes(query) ||
      l.actor.toLowerCase().includes(query) ||
      l.action.toLowerCase().includes(query) ||
      l.target.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Audit
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Audit Logs
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track administrative actions for compliance (UI only).
          </p>
        </div>
        <Badge tone="info">Placeholder</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Events</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar value={q} onChange={setQ} placeholder="Search audit logs…" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>ID</TH>
                <TH>Actor</TH>
                <TH>Action</TH>
                <TH>Target</TH>
                <TH>IP</TH>
                <TH className="text-right">Time</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">{l.id}</TD>
                  <TD>{l.actor}</TD>
                  <TD>{l.action}</TD>
                  <TD>{l.target}</TD>
                  <TD>{l.ip}</TD>
                  <TD className="text-right">{l.time}</TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

