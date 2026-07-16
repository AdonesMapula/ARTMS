import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";

export default function Profile() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Account
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Profile
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your profile details (UI only).
          </p>
        </div>
        <Badge tone="info">UI only</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Full name" name="name" defaultValue="HR Admin" />
            <Input label="Email" name="email" type="email" defaultValue="hradmin@company.com" />
            <Input label="Department" name="dept" defaultValue="Human Resources" />
            <Input label="Phone" name="phone" defaultValue="+63…" />
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="accent" onClick={() => alert("Placeholder: profile saved (UI only).")}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

