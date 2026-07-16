import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import { useMemo, useState } from "react";
import { mockManpowerRequests } from "../../utils/mockData";

export default function RequestHistory() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return mockManpowerRequests.filter((r) => {
      if (!query) return true;
      return (
        r.id.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query) ||
        r.positionTitle.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query)
      );
    });
  }, [q]);

  const total = filtered.length;
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Requests
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Request history & status
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review your submitted manpower requests and approvals (UI only).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All requests</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar value={q} onChange={(v) => { setPage(1); setQ(v); }} placeholder="Search ID, position, status…" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>ID</TH>
                <TH>Department</TH>
                <TH>Position</TH>
                <TH>Status</TH>
                <TH className="text-right">Submitted</TH>
              </tr>
            </THead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">{r.id}</TD>
                  <TD>{r.department}</TD>
                  <TD>{r.positionTitle}</TD>
                  <TD>
                    <StatusChip status={r.status} />
                  </TD>
                  <TD className="text-right">{r.submittedAt}</TD>
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

