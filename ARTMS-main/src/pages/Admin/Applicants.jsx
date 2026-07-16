import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiFilter } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import { mockApplicants } from "../../utils/mockData";

const STATUSES = ["All", "New", "Screening", "Interview", "Hired", "Rejected"];
const STAGE_TONE = { New: "info", Screening: "warning", Interview: "accent", Hired: "success", Rejected: "danger" };

export default function Applicants() {
  const [q, setQ]           = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage]     = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return mockApplicants.filter(a => {
      const matchQ = !query || a.name.toLowerCase().includes(query) || a.role.toLowerCase().includes(query) || a.id.toLowerCase().includes(query);
      const matchS = status === "All" || a.status === status;
      return matchQ && matchS;
    });
  }, [q, status]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Applicants</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Applicant Management</h1>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} applicant{filtered.length !== 1 ? "s" : ""} found.</p>
        </div>
        {/* Stage filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-bold transition border ${
                status === s
                  ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Applicants</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar value={q} onChange={v => { setPage(1); setQ(v); }} placeholder="Search by name, role, ID…" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Applicant</TH>
                <TH>Role Applied</TH>
                <TH>Status</TH>
                <TH>Score</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <TD colSpan={5} className="py-10 text-center text-slate-400">No applicants match your search.</TD>
                </tr>
              ) : pageItems.map((a, i) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                        {a.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-400">{a.id}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-slate-600">{a.role}</TD>
                  <TD><StatusChip status={a.status} /></TD>
                  <TD>
                    {a.score
                      ? <span className="font-bold text-slate-900">{a.score}<span className="text-slate-400 font-normal text-xs">/100</span></span>
                      : <span className="text-slate-400">—</span>}
                  </TD>
                  <TD className="text-right">
                    <Link
                      to={`/admin/applicants/${a.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <FiUser size={12} /> View Details
                    </Link>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-4">
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
