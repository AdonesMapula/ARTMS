import { useState } from "react";
import { FiSliders, FiMail, FiBell, FiShield, FiCheck } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

export default function Settings() {
  const [threshold, setThreshold]   = useState("75");
  const [notifFreq, setNotifFreq]   = useState("realtime");
  const [emailNew, setEmailNew]     = useState(true);
  const [emailSchedule, setEmailSchedule] = useState(true);
  const [saved, setSaved]           = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Preferences</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Configure recruitment workflow and notification preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Recruitment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FiSliders className="text-slate-400" />
              <CardTitle>Recruitment Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SettingSelect
              label="AI Screening Threshold"
              hint="Applicants below this score are flagged as low fit."
              value={threshold}
              onChange={setThreshold}
              options={[["65","65%"],["70","70%"],["75","75%"],["80","80%"],["85","85%"]]}
            />
            <SettingSelect
              label="Notification Frequency"
              hint="How often you receive digest emails."
              value={notifFreq}
              onChange={setNotifFreq}
              options={[["realtime","Real-time"],["daily","Daily Digest"],["weekly","Weekly Summary"]]}
            />
          </CardContent>
        </Card>

        {/* Email notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FiMail className="text-slate-400" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle label="New Application Received" desc="Get an email whenever a new applicant submits." checked={emailNew} onChange={setEmailNew} />
            <Toggle label="Interview Scheduled"      desc="Get an email when an interview is added to the calendar." checked={emailSchedule} onChange={setEmailSchedule} />
          </CardContent>
        </Card>

        {/* Security info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FiShield className="text-slate-400" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow label="Session Timeout"    value="120 minutes" />
              <InfoRow label="Password Policy"    value="Min. 8 characters" />
              <InfoRow label="2FA Status"         value={<Badge tone="warning">Not Enabled</Badge>} />
              <InfoRow label="Last Password Change" value="—" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <FiCheck /> Settings saved
            </span>
          )}
          <button
            type="submit"
            className="rounded-xl bg-[var(--artms-primary)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--artms-primary-2)] transition"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingSelect({ label, hint, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-800">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--artms-border)] bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--artms-primary)] focus:ring-2 focus:ring-[var(--artms-primary)]/20"
      >
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--artms-border)] bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[var(--artms-primary)]" : "bg-slate-200"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--artms-border)] bg-slate-50 px-4 py-3">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );
}
