import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { mockManpowerRequests } from "../../utils/mockData";

export default function AdminManpowerRequests() {
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState({ open: false, action: "approve", id: null });

  const rows = useMemo(() => {
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

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Management
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Manpower Request Management
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review, approve/reject, and convert requests to job postings (UI only).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Requests</CardTitle>
            <div className="w-full sm:max-w-sm">
              <SearchBar value={q} onChange={setQ} placeholder="Search by ID, dept, status…" />
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
                <TH>Vacancies</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">{r.id}</TD>
                  <TD>{r.department}</TD>
                  <TD>{r.positionTitle}</TD>
                  <TD>{r.vacancies}</TD>
                  <TD>
                    <StatusChip status={r.status} />
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alert("Placeholder: open request details (UI only).")}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setConfirm({ open: true, action: "approve", id: r.id })}
                        disabled={r.status !== "Pending"}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirm({ open: true, action: "reject", id: r.id })}
                        disabled={r.status !== "Pending"}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => alert("Placeholder: convert to job posting (UI only).")}
                        disabled={r.status !== "Approved"}
                      >
                        Convert
                      </Button>
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.action === "approve" ? "Approve request?" : "Reject request?"}
        description={`This is UI-only. Confirm to simulate a ${confirm.action} action for ${confirm.id}.`}
        confirmLabel={confirm.action === "approve" ? "Approve" : "Reject"}
        tone={confirm.action === "reject" ? "danger" : "primary"}
        onConfirm={() => alert(`Placeholder: ${confirm.action} confirmed for ${confirm.id}.`)}
        onClose={() => setConfirm({ open: false, action: "approve", id: null })}
      />
    </div>
  );
}

