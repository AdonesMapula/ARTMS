import { useMemo, useState } from "react";
import { FiInbox, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { mockManpowerRequests } from "../../utils/mockData";

const URGENCY_TONE = { Low: "default", Medium: "info", High: "warning", Critical: "danger" };

export default function AdminManpowerRequests() {
  const [q, setQ]           = useState("");
  const [filter, setFilter] = useState("All");

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return mockManpowerRequests
      .map((r, i) => ({ ...r, urgency: ["Low","Medium","High","Critical","Medium"][i % 5] }))
      .filter(r => {
        const matchQ = !query || r.id.toLowerCase().includes(query) || r.department.toLowerCase().includes(query) || r.positionTitle.toLowerCase().includes(query);
        const matchF = filter === "All" || r.status === filter;
        return matchQ && matchF;
      });
  }, [q, filter]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Requests</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Manpower Request Management</h1>
        <p className="mt-1 text-sm text-slate-500">Review department staffing requests submitted for HR processing.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total",    value: mockManpowerRequests.length,                                                icon: <FiInbox />,        tone: "bg-blue-50 text-blue-700"       },
          { label: "Pending",  value: mockManpowerRequests.filter(r => r.status === "Pending").length,            icon: <FiClock />,        tone: "bg-amber-50 text-amber-700"     },
          { label: "Approved", value: mockManpowerRequests.filter(r => r.status === "Approved").length,           icon: <FiCheckCircle />,  tone: "bg-emerald-50 text-emerald-700" },
          { label: "Rejected", value: mockManpowerRequests.filter(r => r.status === "Rejected").length,           icon: <FiXCircle />,      tone: "bg-red-50 text-red-700"         },
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
            <CardTitle>All Requests</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {["All","Pending","Approved","Rejected"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-bold border transition ${
                    filter === f ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}>{f}</button>
              ))}
              <div className="w-52">
                <SearchBar value={q} onChange={setQ} placeholder="Search requests…" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Request ID</TH>
                <TH>Department</TH>
                <TH>Position</TH>
                <TH>Vacancies</TH>
                <TH>Urgency</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <tbody>
              {rows.length === 0 ? (
                <tr><TD colSpan={6} className="py-10 text-center text-slate-400">No requests match your filter.</TD></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">{r.id}</TD>
                  <TD className="text-slate-600">{r.department}</TD>
                  <TD className="font-medium text-slate-800">{r.positionTitle}</TD>
                  <TD className="font-bold text-slate-900">{r.vacancies}</TD>
                  <TD><Badge tone={URGENCY_TONE[r.urgency] ?? "default"}>{r.urgency}</Badge></TD>
                  <TD><StatusChip status={r.status} /></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
