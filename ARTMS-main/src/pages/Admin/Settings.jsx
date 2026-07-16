import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

export default function Settings() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Preferences
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Configure recruitment workflow settings (UI only).
          </p>
        </div>
        <Badge tone="info">UI only</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recruitment preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <Select
              label="Default screening threshold"
              name="threshold"
              defaultValue="75"
              options={[
                { value: "65", label: "65%" },
                { value: "70", label: "70%" },
                { value: "75", label: "75%" },
                { value: "80", label: "80%" },
              ]}
            />
            <Select
              label="Notification frequency"
              name="notif"
              defaultValue="realtime"
              options={[
                { value: "realtime", label: "Real-time" },
                { value: "daily", label: "Daily digest" },
                { value: "weekly", label: "Weekly summary" },
              ]}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="accent" onClick={() => alert("Placeholder: settings saved (UI only).")}>
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

