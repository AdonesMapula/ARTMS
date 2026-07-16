import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

export default function ManpowerRequest() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Manpower Request
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Submit a Manpower Request Form
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Use this form to request additional manpower (UI only).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
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
            <Input label="Position Title" name="positionTitle" placeholder="e.g., Customer Support Associate" />
            <Select
              label="Employment Type"
              name="employmentType"
              defaultValue="Full-time"
              options={[
                { value: "Full-time", label: "Full-time" },
                { value: "Part-time", label: "Part-time" },
                { value: "Contract", label: "Contract" },
                { value: "Internship", label: "Internship" },
              ]}
            />
            <Input label="Number of Vacancies" name="vacancies" type="number" placeholder="e.g., 3" />

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="jobDescription">
                Job Description
              </label>
              <textarea
                id="jobDescription"
                className="min-h-28 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                placeholder="Describe responsibilities and expectations…"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="qualifications">
                Required Qualifications
              </label>
              <textarea
                id="qualifications"
                className="min-h-24 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                placeholder="List minimum requirements…"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="skills">
                Preferred Skills
              </label>
              <textarea
                id="skills"
                className="min-h-24 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                placeholder="Nice-to-have skills…"
              />
            </div>

            <Select
              label="Reason for Request"
              name="reason"
              defaultValue="Replacement"
              options={[
                { value: "Replacement", label: "Replacement" },
                { value: "Expansion", label: "Expansion" },
                { value: "New Position", label: "New Position" },
                { value: "Other", label: "Other" },
              ]}
            />
            <Select
              label="Priority Level"
              name="priority"
              defaultValue="Medium"
              options={[
                { value: "Low", label: "Low" },
                { value: "Medium", label: "Medium" },
                { value: "High", label: "High" },
                { value: "Urgent", label: "Urgent" },
              ]}
            />
            <Input label="Target Hiring Date" name="targetHiringDate" type="date" />
            <Input label="Additional Remarks" name="remarks" placeholder="Optional notes for HR" />
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => alert("Placeholder: draft saved (UI only).")}>
              Save draft
            </Button>
            <Button variant="accent" onClick={() => setOpen(true)}>
              Submit request
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={open}
        title="Request submitted (placeholder)"
        description="No backend yet—this confirms the Department Head flow."
        onClose={() => setOpen(false)}
      >
        <p className="text-sm text-slate-600">
          Your manpower request has been submitted for HR review. You will be notified upon approval/rejection.
        </p>
      </Modal>
    </div>
  );
}

