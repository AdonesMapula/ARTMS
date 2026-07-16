import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import { useState } from "react";
import { mockJobs } from "../../utils/mockData";

export default function JobLibrary() {
  const [q, setQ] = useState("");
  const rows = mockJobs.filter((j) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      j.title.toLowerCase().includes(query) ||
      j.department.toLowerCase().includes(query) ||
      j.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Library
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Job Library
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Reusable job templates and descriptions (UI only).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Templates</CardTitle>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="w-full sm:w-80">
                <SearchBar value={q} onChange={setQ} placeholder="Search templates…" />
              </div>
              <Button variant="accent" onClick={() => alert("Placeholder: create template (UI only).")}>
                New template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Title</TH>
                <TH>Department</TH>
                <TH>Type</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">
                    {j.title}
                    <div className="text-xs font-medium text-slate-500">{j.id}</div>
                  </TD>
                  <TD>{j.department}</TD>
                  <TD>
                    <Badge tone="accent">{j.employmentType}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => alert("Placeholder: view template (UI only).")}>
                        View
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => alert("Placeholder: edit template (UI only).")}>
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
    </div>
  );
}

