import { useState } from "react";
import { FiCalendar, FiClock, FiMapPin, FiCheckCircle } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";

const INTERVIEWS = [
  { id: "INT-1001", applicant: "Alex Rivera",  role: "Customer Support Associate", date: "Jul 22, 2026", time: "10:00 AM", type: "In-Person", stage: "Interview 1", status: "Scheduled" },
  { id: "INT-1002", applicant: "Sam Santos",   role: "Talent Acquisition Specialist", date: "Jul 22, 2026", time: "11:00 AM", type: "Online",    stage: "Interview 1", status: "Confirmed" },
  { id: "INT-1003", applicant: "Jamie Cruz",   role: "Data Analyst",               date: "Jul 23, 2026", time: "2:00 PM",  type: "Online",    stage: "Interview 2", status: "Scheduled" },
  { id: "INT-1004", applicant: "Rina Gomez",   role: "HR Generalist",              date: "Jul 24, 2026", time: "9:00 AM",  type: "In-Person", stage: "Final",       status: "Confirmed" },
];

const STATUS_TONE = { Scheduled: "info", Confirmed: "success", Done: "default", Cancelled: "danger", "No Show": "danger" };
const STAGE_TONE  = { "Interview 1": "info", "Interview 2": "warning", Final: "accent" };

export default function Interviews() {
  const [view, setView] = useState("list");

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Scheduling</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Interview Scheduling</h1>
          <p className="mt-1 text-sm text-slate-500">{INTERVIEWS.length} interviews upcoming this week.</p>
        </div>
        <div className="flex gap-2">
          {["list", "calendar"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold capitalize transition ${
                view === v ? "bg-[var(--artms-primary)] text-white border-[var(--artms-primary)]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >{v} View</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Scheduled",  value: INTERVIEWS.filter(i => i.status === "Scheduled").length,  tone: "bg-blue-50 text-blue-700"    },
          { label: "Confirmed",  value: INTERVIEWS.filter(i => i.status === "Confirmed").length,  tone: "bg-emerald-50 text-emerald-700" },
          { label: "This Week",  value: INTERVIEWS.length,                                         tone: "bg-amber-50 text-amber-700"  },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
              <span className={`rounded-xl px-3 py-1 text-lg font-extrabold ${s.tone}`}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {view === "list" ? (
        <Card>
          <CardHeader><CardTitle>Upcoming Interviews</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>Applicant</TH>
                  <TH>Role</TH>
                  <TH>Stage</TH>
                  <TH>Date & Time</TH>
                  <TH>Type</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <tbody>
                {INTERVIEWS.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <TD className="font-semibold text-slate-900">{i.applicant}<div className="text-xs text-slate-400">{i.id}</div></TD>
                    <TD className="text-slate-500 text-xs max-w-[140px] truncate">{i.role}</TD>
                    <TD><Badge tone={STAGE_TONE[i.stage] ?? "default"}>{i.stage}</Badge></TD>
                    <TD>
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-700"><FiCalendar size={11} />{i.date}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500"><FiClock size={11} />{i.time}</span>
                      </div>
                    </TD>
                    <TD>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <FiMapPin size={11} />{i.type}
                      </span>
                    </TD>
                    <TD><Badge tone={STATUS_TONE[i.status] ?? "default"}>{i.status}</Badge></TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Calendar placeholder */
        <Card>
          <CardHeader><CardTitle>Calendar View</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-xs font-bold text-slate-400 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 1;
                const hasEvent = [22, 23, 24].includes(day);
                return (
                  <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition ${
                    day < 1 || day > 31 ? "text-slate-200" :
                    hasEvent ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                  }`}>
                    {day >= 1 && day <= 31 && <span>{day}</span>}
                    {hasEvent && <span className="mt-0.5 h-1 w-1 rounded-full bg-blue-500" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
