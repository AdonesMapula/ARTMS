import { FiBriefcase, FiEye, FiEyeOff, FiCheckCircle, FiClock } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";

const POSTINGS = [
  { id: "JP-001", title: "Customer Support Associate", dept: "Operations",      vacancies: 3, status: "Published",   approval: "Approved",  applicants: 12 },
  { id: "JP-002", title: "HR Generalist",              dept: "Human Resources", vacancies: 1, status: "Pending",     approval: "Pending",   applicants: 0  },
  { id: "JP-003", title: "Data Analyst",               dept: "IT",              vacancies: 2, status: "Draft",       approval: "Pending",   applicants: 0  },
  { id: "JP-004", title: "Finance Officer",            dept: "Finance",         vacancies: 1, status: "Published",   approval: "Approved",  applicants: 7  },
  { id: "JP-005", title: "Content Writer",             dept: "Marketing",       vacancies: 2, status: "Closed",      approval: "Approved",  applicants: 15 },
];

const STATUS_TONE = { Published: "success", Pending: "warning", Draft: "info", Closed: "default", Cancelled: "danger" };
const APPROVAL_TONE = { Approved: "success", Pending: "warning", Rejected: "danger" };

export default function JobPosting() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Posting</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Job Posting Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage and monitor all active and pending job postings.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Published",  value: POSTINGS.filter(p => p.status === "Published").length,  icon: <FiEye />,          tone: "bg-emerald-50 text-emerald-700" },
          { label: "Pending",    value: POSTINGS.filter(p => p.status === "Pending").length,    icon: <FiClock />,         tone: "bg-amber-50 text-amber-700"    },
          { label: "Closed",     value: POSTINGS.filter(p => p.status === "Closed").length,     icon: <FiEyeOff />,        tone: "bg-slate-100 text-slate-500"   },
          { label: "Total Apps", value: POSTINGS.reduce((s, p) => s + p.applicants, 0),         icon: <FiBriefcase />,     tone: "bg-blue-50 text-blue-700"      },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.tone}`}>{s.icon}</div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All Job Postings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Job Title</TH>
                <TH>Department</TH>
                <TH>Vacancies</TH>
                <TH>Applicants</TH>
                <TH>COO Approval</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <tbody>
              {POSTINGS.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <FiBriefcase size={14} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{p.title}</p>
                        <p className="text-xs text-slate-400">{p.id}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-slate-600">{p.dept}</TD>
                  <TD className="font-bold text-slate-900">{p.vacancies}</TD>
                  <TD>
                    <span className="font-bold text-slate-900">{p.applicants}</span>
                    <span className="text-slate-400 text-xs"> apps</span>
                  </TD>
                  <TD><Badge tone={APPROVAL_TONE[p.approval] ?? "default"}>{p.approval}</Badge></TD>
                  <TD><Badge tone={STATUS_TONE[p.status] ?? "default"}>{p.status}</Badge></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
