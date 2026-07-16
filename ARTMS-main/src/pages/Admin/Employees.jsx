import { useState } from "react";
import { FiUsers, FiUserCheck, FiUserX, FiClock } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";

const EMPLOYEES = [
  { id: "EMP-2001", name: "Taylor Reyes",  dept: "Operations",      position: "Team Lead",        status: "Active",      hired: "Jan 15, 2023" },
  { id: "EMP-2002", name: "Morgan Lee",    dept: "Human Resources", position: "HR Generalist",    status: "Active",      hired: "Mar 3, 2022"  },
  { id: "EMP-2003", name: "Casey Tan",     dept: "IT",              position: "Service Desk",     status: "Onboarding",  hired: "Jul 1, 2026"  },
  { id: "EMP-2004", name: "Jordan Cruz",   dept: "Finance",         position: "Accountant",       status: "Active",      hired: "Sep 20, 2021" },
  { id: "EMP-2005", name: "Riley Santos",  dept: "Operations",      position: "Analyst",          status: "On Leave",    hired: "Jun 5, 2020"  },
  { id: "EMP-2006", name: "Avery Gomez",   dept: "Marketing",       position: "Content Writer",   status: "Resigned",    hired: "Feb 28, 2019" },
];

const STATUS_TONE = { Active: "success", Onboarding: "info", "On Leave": "warning", Resigned: "danger", Terminated: "danger" };

export default function Employees() {
  const [q, setQ]           = useState("");
  const [filter, setFilter] = useState("All");

  const rows = EMPLOYEES.filter(e => {
    const query = q.trim().toLowerCase();
    const matchQ = !query || e.name.toLowerCase().includes(query) || e.dept.toLowerCase().includes(query) || e.id.toLowerCase().includes(query);
    const matchF = filter === "All" || e.status === filter;
    return matchQ && matchF;
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Workforce</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Employee Management</h1>
        <p className="mt-1 text-sm text-slate-500">Active employee records and 201 file management.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard icon={<FiUsers />}     label="Total"      value={EMPLOYEES.length}                                 tone="bg-blue-50  text-blue-700"   />
        <SummaryCard icon={<FiUserCheck />} label="Active"     value={EMPLOYEES.filter(e => e.status === "Active").length} tone="bg-emerald-50 text-emerald-700" />
        <SummaryCard icon={<FiClock />}     label="On Leave"   value={EMPLOYEES.filter(e => e.status === "On Leave").length} tone="bg-amber-50 text-amber-700"  />
        <SummaryCard icon={<FiUserX />}     label="Resigned"   value={EMPLOYEES.filter(e => e.status === "Resigned").length} tone="bg-red-50 text-red-700"     />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Employees</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {["All", "Active", "Onboarding", "On Leave", "Resigned"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-bold border transition ${
                    filter === s ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >{s}</button>
              ))}
              <div className="w-56">
                <SearchBar value={q} onChange={setQ} placeholder="Search employees…" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Employee</TH>
                <TH>Department</TH>
                <TH>Position</TH>
                <TH>Date Hired</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <tbody>
              {rows.length === 0 ? (
                <tr><TD colSpan={5} className="py-10 text-center text-slate-400">No employees match your filter.</TD></tr>
              ) : rows.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                        {e.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.id}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-slate-600">{e.dept}</TD>
                  <TD className="text-slate-600">{e.position}</TD>
                  <TD className="text-slate-500 text-xs">{e.hired}</TD>
                  <TD><Badge tone={STATUS_TONE[e.status] ?? "default"}>{e.status}</Badge></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${tone}`}>{icon}</div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
