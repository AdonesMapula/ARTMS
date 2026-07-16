import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

const columns = [
  { title: "New", items: ["Jamie Cruz", "Pat Dela Rosa", "Kim Alvarez"] },
  { title: "Screening", items: ["Alex Rivera", "Rina Gomez"] },
  { title: "Interview", items: ["Sam Santos"] },
  { title: "Offer", items: ["—"] },
];

export default function Pipeline() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Pipeline
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Recruitment Pipeline
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Kanban-style pipeline board (UI only).
          </p>
        </div>
        <Badge tone="info">Placeholder</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-4">
            {columns.map((c) => (
              <div key={c.title} className="rounded-2xl border border-[var(--artms-border)] bg-[var(--artms-soft)] p-3">
                <p className="text-sm font-extrabold text-slate-900">{c.title}</p>
                <div className="mt-3 space-y-2">
                  {c.items.map((name, idx) => (
                    <div
                      key={`${c.title}-${idx}`}
                      className="rounded-xl border border-[var(--artms-border)] bg-white p-3 text-sm text-slate-700 shadow-sm"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

