import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";

export default function JobPosting() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Posting
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Job Posting Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Create and manage public job postings (UI only).
          </p>
        </div>
        <Badge tone="info">Convert approved requests → posting (UI)</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create job posting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Job Title" name="title" placeholder="e.g., Customer Support Associate" />
            <Select
              label="Department"
              name="department"
              defaultValue=""
              options={[
                { value: "", label: "Select department", disabled: true },
                { value: "Operations", label: "Operations" },
                { value: "Human Resources", label: "Human Resources" },
                { value: "IT", label: "IT" },
                { value: "Finance", label: "Finance" },
              ]}
            />
            <Input label="Location" name="location" placeholder="e.g., Cebu City (Hybrid)" />
            <Select
              label="Employment Type"
              name="employmentType"
              defaultValue="Full-time"
              options={[
                { value: "Full-time", label: "Full-time" },
                { value: "Part-time", label: "Part-time" },
                { value: "Contract", label: "Contract" },
              ]}
            />
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="summary">
                Summary
              </label>
              <textarea
                id="summary"
                className="min-h-24 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                placeholder="Short job overview…"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => alert("Placeholder: saved as draft (UI only).")}>
              Save draft
            </Button>
            <Button variant="accent" onClick={() => alert("Placeholder: job posted (UI only).")}>
              Publish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

