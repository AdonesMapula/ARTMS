import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

const COLUMNS = [
  { key: "applied",   title: "Applied",          color: "bg-blue-50  border-blue-100", badge: "info",    items: ["Jamie Cruz", "Pat Dela Rosa", "Kim Alvarez", "Robin Tan"] },
  { key: "screening", title: "AI Screening",     color: "bg-amber-50 border-amber-100", badge: "warning", items: ["Alex Rivera", "Rina Gomez", "Casey Uy"] },
  { key: "interview", title: "Interview",        color: "bg-violet-50 border-violet-100", badge: "accent", items: ["Sam Santos", "Morgan Lee"] },
  { key: "offer",     title: "For Hiring",       color: "bg-emerald-50 border-emerald-100", badge: "success", items: ["Taylor Reyes"] },
  { key: "hired",     title: "Hired",            color: "bg-slate-50 border-slate-100", badge: "default", items: ["Jordan Cruz"] },
];

export default function Pipeline() {
  const total = COLUMNS.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Pipeline</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Recruitment Pipeline</h1>
        <p className="mt-1 text-sm text-slate-500">{total} active applicants across all stages.</p>
      </div>

      {/* Funnel summary bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            {COLUMNS.map(c => (
              <div key={c.key} className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500">{c.title}</p>
                  <p className="text-xl font-extrabold text-slate-900">{c.items.length}</p>
                </div>
                {c.key !== "hired" && <div className="text-slate-300 font-bold">→</div>}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full">
            {COLUMNS.map(c => (
              <div
                key={c.key}
                className={`transition-all ${c.badge === "info" ? "bg-blue-400" : c.badge === "warning" ? "bg-amber-400" : c.badge === "accent" ? "bg-violet-400" : c.badge === "success" ? "bg-emerald-400" : "bg-slate-300"}`}
                style={{ width: `${(c.items.length / total) * 100}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban board */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0,1fr))` }}>
        {COLUMNS.map(c => (
          <div key={c.key} className={`rounded-2xl border p-3 ${c.color}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-extrabold text-slate-700">{c.title}</p>
              <Badge tone={c.badge}>{c.items.length}</Badge>
            </div>
            <div className="space-y-2">
              {c.items.map((name, i) => (
                <div key={i} className="rounded-xl border border-[var(--artms-border)] bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
