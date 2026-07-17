import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";

export default function SuperAdminSettings() {
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });

  const showAlert = (variant, title, message) =>
    setAlert({ open: true, variant, title, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            System
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            System Settings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Configure governance and security settings (UI only).
          </p>
        </div>
        <Badge tone="info">UI only</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security & policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <Select
              label="Require OTP for password reset"
              name="otp"
              defaultValue="optional"
              options={[
                { value: "disabled", label: "Disabled" },
                { value: "optional", label: "Optional" },
                { value: "required", label: "Required" },
              ]}
            />
            <Select
              label="Session timeout"
              name="timeout"
              defaultValue="30"
              options={[
                { value: "15", label: "15 minutes" },
                { value: "30", label: "30 minutes" },
                { value: "60", label: "60 minutes" },
              ]}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              variant="accent"
              onClick={() =>
                showAlert(
                  "success",
                  "Settings Saved",
                  "Your system settings have been saved successfully."
                )
              }
            >
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertModal
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />
    </div>
  );
}
