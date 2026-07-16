import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import { mockApplicants } from "../../utils/mockData";

export default function Applicants() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return mockApplicants.filter((a) => {
      if (!query) return true;
      return (
        a.name.toLowerCase().includes(query) ||
        a.role.toLowerCase().includes(query) ||
        a.status.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query)
      );
    });
  }, [q]);

  const total = filtered.length;
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Applicants
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Applicant Management
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          View and manage applicant lists (UI only).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Applicants</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar value={q} onChange={(v) => { setPage(1); setQ(v); }} placeholder="Search applicants…" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Applicant</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {pageItems.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">
                    {a.name}
                    <div className="text-xs font-medium text-slate-500">{a.id}</div>
                  </TD>
                  <TD>{a.role}</TD>
                  <TD>
                    <StatusChip status={a.status} />
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-2">
                      <Button as={Link} to={`/admin/applicants/${a.id}`} size="sm" variant="outline">
                        View details
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => alert("Placeholder: advance stage (UI only).")}>
                        Move stage
                      </Button>
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="mt-4">
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

