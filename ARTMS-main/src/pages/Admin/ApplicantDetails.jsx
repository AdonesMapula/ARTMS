import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatusChip from "../../components/ui/StatusChip";
import { mockApplicants } from "../../utils/mockData";

export default function ApplicantDetails() {
  const { id } = useParams();
  const applicant = mockApplicants.find((a) => a.id === id);

  if (!applicant) {
    return (
      <div className="rounded-2xl border border-[var(--artms-border)] bg-white p-6">
        <p className="text-sm font-extrabold text-slate-900">Applicant not found</p>
        <p className="mt-1 text-sm text-slate-600">
          This is placeholder data. Return to the applicant list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Applicant details
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {applicant.name}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            UI-only profile: resume, screening score, notes, and actions will be integrated later.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{applicant.id}</Badge>
          <StatusChip status={applicant.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Applied role" value={applicant.role} />
              <Field label="Source" value={applicant.source} />
              <Field label="Applied at" value={applicant.appliedAt} />
              <Field label="Screening score" value={applicant.score ? `${applicant.score}/100` : "Pending"} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => alert("Placeholder: schedule interview (UI only).")}>
                Schedule interview
              </Button>
              <Button variant="outline" onClick={() => alert("Placeholder: open resume (UI only).")}>
                View resume
              </Button>
              <Button variant="danger" onClick={() => alert("Placeholder: reject applicant (UI only).")}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="min-h-40 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
              placeholder="Add evaluation notes (UI only)…"
            />
            <div className="mt-3 flex justify-end">
              <Button variant="outline" onClick={() => alert("Placeholder: notes saved (UI only).")}>
                Save notes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--artms-border)] bg-[var(--artms-soft)] p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

