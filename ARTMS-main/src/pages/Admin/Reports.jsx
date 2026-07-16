import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

export default function Reports() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Analytics
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Reports
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder report cards and charts for hiring KPIs.
          </p>
        </div>
        <Badge tone="info">UI only</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Source effectiveness", desc: "Track applicants by source and conversion." },
          { title: "Time-to-hire", desc: "Monitor cycle times and bottlenecks." },
          { title: "Interview outcomes", desc: "Analyze pass rates and interviewer load." },
        ].map((r) => (
          <Card key={r.title} className="transition hover:shadow-md">
            <CardHeader>
              <CardTitle>{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{r.desc}</p>
              <div className="mt-4 h-24 rounded-2xl bg-[var(--artms-soft)]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

