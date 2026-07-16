import { FiTrendingUp, FiClock, FiUsers, FiBarChart2 } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

const REPORT_CARDS = [
  {
    title: "Recruitment Funnel",
    icon: <FiUsers size={20} />,
    tone: "bg-blue-50 text-blue-700",
    desc: "Applied → Screened → Interviewed → Hired",
    data: [
      { label: "Applied",   value: 48 },
      { label: "Screened",  value: 31 },
      { label: "Interview", value: 14 },
      { label: "Hired",     value:  6 },
    ],
  },
  {
    title: "Time-to-Hire",
    icon: <FiClock size={20} />,
    tone: "bg-violet-50 text-violet-700",
    desc: "Average days from application to offer",
    data: [
      { label: "Jul 2026",  value: 18 },
      { label: "Jun 2026",  value: 22 },
      { label: "May 2026",  value: 25 },
      { label: "Apr 2026",  value: 20 },
    ],
  },
  {
    title: "Source Effectiveness",
    icon: <FiTrendingUp size={20} />,
    tone: "bg-emerald-50 text-emerald-700",
    desc: "Applicants by source channel",
    data: [
      { label: "Job Board",   value: 22 },
      { label: "Referral",    value: 14 },
      { label: "Social Media",value:  8 },
      { label: "Direct",      value:  4 },
    ],
  },
  {
    title: "Interview Outcomes",
    icon: <FiBarChart2 size={20} />,
    tone: "bg-amber-50 text-amber-700",
    desc: "Pass and fail rates per stage",
    data: [
      { label: "Interview 1 Pass", value: 72 },
      { label: "Interview 1 Fail", value: 28 },
      { label: "Interview 2 Pass", value: 61 },
      { label: "Interview 2 Fail", value: 39 },
    ],
  },
];

export default function Reports() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Analytics</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Recruitment KPIs and HR analytics overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORT_CARDS.map(r => (
          <Card key={r.title} className="transition hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.tone}`}>{r.icon}</div>
                <div>
                  <CardTitle>{r.title}</CardTitle>
                  <p className="mt-0.5 text-xs text-slate-500">{r.desc}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MiniChart items={r.data} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly hiring trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Hiring Trend — 2026</CardTitle>
            <Badge tone="info">Sample data</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { m: "January",   v: 2 }, { m: "February",  v: 3 }, { m: "March",    v: 5 },
              { m: "April",     v: 4 }, { m: "May",        v: 6 }, { m: "June",     v: 8 },
              { m: "July",      v: 6 },
            ].map(({ m, v }) => (
              <div key={m} className="grid grid-cols-12 items-center gap-3">
                <span className="col-span-2 text-xs font-semibold text-slate-500">{m.slice(0, 3)}</span>
                <div className="col-span-9 h-2.5 w-full rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-blue-500 transition-all" style={{ width: `${(v / 10) * 100}%` }} />
                </div>
                <span className="col-span-1 text-right text-xs font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniChart({ items }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <div key={item.label} className="grid grid-cols-12 items-center gap-2">
          <span className="col-span-4 truncate text-xs font-semibold text-slate-600">{item.label}</span>
          <div className="col-span-7 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-slate-400 transition-all" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <span className="col-span-1 text-right text-xs font-bold text-slate-700">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
