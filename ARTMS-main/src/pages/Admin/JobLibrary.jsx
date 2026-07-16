import { useState } from "react";
import { FiBookOpen, FiCheckCircle, FiClock } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import { mockJobs } from "../../utils/mockData";

const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };

export default function JobLibrary() {
  const [q, setQ]           = useState("");
  const [filter, setFilter] = useState("all");

  const jobs = mockJobs.map((j, i) => ({
    ...j,
    approval: ["approved", "pending", "pending", "approved", "rejected"][i % 5],
    category: ["Operations", "HR", "IT", "Finance", "Marketing"][i % 5],
  }));

  const rows = jobs.filter(j => {
    const query = q.trim().toLowerCase();
    const matchQ = !query || j.title.toLowerCase().includes(query) || j.department.toLowerCase().includes(query);
    const matchF = filter === "all" || j.approval === filter;
    return matchQ && matchF;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Library</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Job Library</h1>
          <p className="mt-1 text-sm text-slate-500">Reusable job templates — requires COO approval before posting.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "approved", "pending", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize border transition ${
                filter === f ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Approved",  value: jobs.filter(j => j.approval === "approved").length,  icon: <FiCheckCircle />, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Pending",   value: jobs.filter(j => j.approval === "pending").length,   icon: <FiClock />,       tone: "bg-amber-50 text-amber-700"    },
          { label: "Total",     value: jobs.length,                                          icon: <FiBookOpen />,    tone: "bg-blue-50 text-blue-700"      },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.tone}`}>{s.icon}</div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Job Templates</CardTitle>
            <div className="w-full sm:max-w-xs">
              <SearchBar value={q} onChange={setQ} placeholder="Search templates…" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Job Title</TH>
                <TH>Department</TH>
                <TH>Type</TH>
                <TH>Approval</TH>
              </tr>
            </THead>
            <tbody>
              {rows.length === 0 ? (
                <tr><TD colSpan={4} className="py-10 text-center text-slate-400">No templates match your filter.</TD></tr>
              ) : rows.map(j => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <TD>
                    <p className="font-semibold text-slate-900">{j.title}</p>
                    <p className="text-xs text-slate-400">{j.id}</p>
                  </TD>
                  <TD className="text-slate-600">{j.department}</TD>
                  <TD><Badge tone="accent">{j.employmentType}</Badge></TD>
                  <TD><Badge tone={APPROVAL_TONE[j.approval] ?? "default"} className="capitalize">{j.approval}</Badge></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
