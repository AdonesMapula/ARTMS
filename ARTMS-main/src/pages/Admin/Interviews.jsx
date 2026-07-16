import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Table, TD, TH, THead } from "../../components/ui/Table";

const interviews = [
  { id: "INT-1001", applicant: "Alex Rivera", role: "Customer Support Associate", date: "2026-07-10", time: "10:00 AM", panel: "Ops Lead" },
  { id: "INT-1002", applicant: "Sam Santos", role: "Talent Acquisition Specialist", date: "2026-07-10", time: "11:00 AM", panel: "HR Manager" },
  { id: "INT-1003", applicant: "Jamie Cruz", role: "Data Analyst", date: "2026-07-11", time: "02:00 PM", panel: "People Analytics" },
];

export default function Interviews() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Scheduling
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Interview Scheduling
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Schedule and manage interviews with placeholder calendar/table UI.
          </p>
        </div>
        <Badge tone="info">UI only</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule new interview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-4">
            <Input label="Applicant" name="applicant" placeholder="Search applicant…" />
            <Input label="Role" name="role" placeholder="Position title…" />
            <Input label="Date" name="date" type="date" />
            <Input label="Time" name="time" placeholder="e.g., 10:30 AM" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="accent" onClick={() => alert("Placeholder: interview scheduled (UI only).")}>
              Add to schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>ID</TH>
                <TH>Applicant</TH>
                <TH>Role</TH>
                <TH>Date</TH>
                <TH>Time</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {interviews.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <TD className="font-semibold text-slate-900">{i.id}</TD>
                  <TD>{i.applicant}</TD>
                  <TD>{i.role}</TD>
                  <TD>{i.date}</TD>
                  <TD>{i.time}</TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => alert("Placeholder: reschedule (UI only).")}>
                        Reschedule
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => alert("Placeholder: cancel (UI only).")}>
                        Cancel
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

