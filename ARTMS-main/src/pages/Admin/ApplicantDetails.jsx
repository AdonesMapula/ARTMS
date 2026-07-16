import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiMessageSquare, FiCalendar, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import StatusChip from "../../components/ui/StatusChip";
import { mockApplicants } from "../../utils/mockData";

const TIMELINE = [
  { stage: "Application Received", done: true },
  { stage: "AI Screening",         done: true },
  { stage: "HR Review",            done: true },
  { stage: "Interview 1",          done: false },
  { stage: "Interview 2",          done: false },
  { stage: "Final Decision",       done: false },
];

export default function ApplicantDetails() {
  const { id }       = useParams();
  const applicant    = mockApplicants.find(a => a.id === id);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  if (!applicant) return (
    <div className="rounded-2xl border border-[var(--artms-border)] bg-white p-8 text-center">
      <p className="font-extrabold text-slate-900">Applicant not found</p>
      <Link to="/admin/applicants" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--artms-primary)] hover:underline">
        <FiArrowLeft size={14} /> Back to list
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Link to="/admin/applicants" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[var(--artms-primary)] mb-1">
            <FiArrowLeft size={12} /> Back to Applicants
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Applicant Profile</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{applicant.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{applicant.role}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{applicant.id}</Badge>
          <StatusChip status={applicant.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left — info + docs */}
        <div className="space-y-4 lg:col-span-2">
          {/* Info card */}
          <Card>
            <CardHeader><CardTitle>Application Info</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Applied Role"   value={applicant.role} />
                <Field label="Source"         value={applicant.source ?? "Job Board"} />
                <Field label="Applied Date"   value={applicant.appliedAt ?? "Jul 1, 2026"} />
                <Field label="AI Score"       value={applicant.score ? `${applicant.score} / 100` : "Pending"} />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader><CardTitle>Submitted Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["Resume / CV", "Cover Letter", "Government ID"].map(doc => (
                  <div key={doc} className="flex items-center justify-between rounded-xl border border-[var(--artms-border)] bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                      <FiFileText className="text-slate-400" /> {doc}
                    </div>
                    <Badge tone="success">Submitted</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* HR Decision */}
          <Card>
            <CardHeader><CardTitle>HR Decision</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <DecisionCard icon={<FiCalendar />}     label="Schedule Interview" tone="bg-blue-50 text-blue-700 border-blue-100" />
                <DecisionCard icon={<FiCheckCircle />}  label="Mark as Hired"      tone="bg-emerald-50 text-emerald-700 border-emerald-100" />
                <DecisionCard icon={<FiXCircle />}      label="Reject Applicant"   tone="bg-red-50 text-red-700 border-red-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — timeline + notes */}
        <div className="space-y-4">
          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Application Progress</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {TIMELINE.map((t, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {t.done ? "✓" : i + 1}
                    </span>
                    <span className={`text-sm font-semibold ${t.done ? "text-slate-900" : "text-slate-400"}`}>{t.stage}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FiMessageSquare className="text-slate-400" />
                <CardTitle>Evaluation Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                rows={5}
                value={note}
                onChange={e => { setNote(e.target.value); setSaved(false); }}
                placeholder="Add your notes about this applicant…"
                className="w-full rounded-xl border border-[var(--artms-border)] bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--artms-primary)] focus:ring-2 focus:ring-[var(--artms-primary)]/20 resize-none"
              />
              <div className="mt-3 flex items-center justify-between">
                {saved && <span className="text-xs font-semibold text-emerald-600">✓ Saved</span>}
                <button
                  onClick={() => setSaved(true)}
                  className="ml-auto rounded-xl bg-[var(--artms-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--artms-primary-2)] transition"
                >
                  Save Note
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DecisionCard({ icon, label, tone }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${tone}`}>
      {icon} {label}
    </div>
  );
}
