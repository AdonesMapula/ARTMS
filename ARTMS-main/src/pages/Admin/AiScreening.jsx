import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import { mockApplicants } from "../../utils/mockData";

export default function AiScreening() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            AI Screening
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            AI Resume Screening (UI only)
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder interface for scoring, ranking, and screening decisions.
          </p>
        </div>
        <Badge tone="info">No AI logic yet</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Screening queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Applicant</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Score</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {mockApplicants.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">{a.name}</TD>
                  <TD>{a.role}</TD>
                  <TD>
                    <StatusChip status={a.status} />
                  </TD>
                  <TD>{a.score || "—"}</TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => alert("Placeholder: view resume (UI only).")}>
                        View
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => alert("Placeholder: shortlist (UI only).")}>
                        Shortlist
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => alert("Placeholder: reject (UI only).")}>
                        Reject
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

