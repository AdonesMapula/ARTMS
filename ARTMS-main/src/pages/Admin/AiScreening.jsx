import { useState } from "react";
import { FiCpu, FiCheckCircle, FiXCircle, FiEye } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import { mockApplicants } from "../../utils/mockData";

const FIT_TONE = { High: "success", Medium: "warning", Low: "danger" };

export default function AiScreening() {
  const [selected, setSelected] = useState(null);

  const rows = mockApplicants.map((a, i) => ({
    ...a,
    aiScore:    [82, 91, 64, 78, 55, 88, 73][i % 7],
    fitLabel:   ["High", "High", "Low", "Medium", "Low", "High", "Medium"][i % 7],
    confidence: [88, 95, 60, 74, 52, 90, 71][i % 7],
  }));

  const active = selected ? rows.find(r => r.id === selected) : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">AI Screening</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">AI Resume Screening</h1>
        <p className="mt-1 text-sm text-slate-500">AI-generated scores and fit labels for each applicant.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Screened" value={rows.length} tone="bg-blue-50 text-blue-700" />
        <SummaryCard label="High Fit" value={rows.filter(r => r.fitLabel === "High").length} tone="bg-emerald-50 text-emerald-700" />
        <SummaryCard label="Low Fit" value={rows.filter(r => r.fitLabel === "Low").length} tone="bg-red-50 text-red-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Screening Queue</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>Applicant</TH>
                  <TH>Role</TH>
                  <TH>AI Score</TH>
                  <TH>Fit</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Action</TH>
                </tr>
              </THead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id} className={`hover:bg-slate-50 cursor-pointer ${selected === a.id ? "bg-blue-50" : ""}`}>
                    <TD className="font-semibold text-slate-900">{a.name}</TD>
                    <TD className="text-slate-500 text-xs max-w-[120px] truncate">{a.role}</TD>
                    <TD>
                      <span className="font-bold text-slate-900">{a.aiScore}</span>
                      <span className="text-slate-400 text-xs">/100</span>
                    </TD>
                    <TD><Badge tone={FIT_TONE[a.fitLabel] ?? "default"}>{a.fitLabel}</Badge></TD>
                    <TD><StatusChip status={a.status} /></TD>
                    <TD className="text-right">
                      <button
                        onClick={() => setSelected(a.id === selected ? null : a.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <FiEye size={13} /> Review
                      </button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card>
          <CardHeader>
            <CardTitle>{active ? active.name : "Select an applicant"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!active ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
                <FiCpu size={32} />
                <p className="text-sm text-center">Click Review on any row to see the AI breakdown here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score ring */}
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-blue-200 bg-white text-xl font-extrabold text-[var(--artms-primary)]">
                    {active.aiScore}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Score</p>
                    <Badge tone={FIT_TONE[active.fitLabel] ?? "default"} className="mt-1">{active.fitLabel} Fit</Badge>
                    <p className="mt-1 text-xs text-slate-500">Confidence: {active.confidence}%</p>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="space-y-2">
                  {[
                    { label: "Education",   pct: 20 },
                    { label: "Experience",  pct: 25 },
                    { label: "Skills",      pct: 22 },
                    { label: "Overall Fit", pct: 15 },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>{b.label}</span><span>{b.pct}/25</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(b.pct / 25) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* HR decision chips */}
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">HR Decision</p>
                  <div className="flex gap-2">
                    <DecisionChip icon={<FiCheckCircle />} label="Qualified" color="text-emerald-600 bg-emerald-50 border-emerald-200" />
                    <DecisionChip icon={<FiXCircle />} label="Not Qualified" color="text-red-600 bg-red-50 border-red-200" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`rounded-xl px-3 py-1 text-lg font-extrabold ${tone}`}>{value}</span>
      </CardContent>
    </Card>
  );
}

function DecisionChip({ icon, label, color }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${color}`}>
      {icon} {label}
    </span>
  );
}
