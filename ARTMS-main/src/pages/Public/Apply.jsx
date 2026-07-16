import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiUploadCloud } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { mockJobs } from "../../utils/mockData";

export default function Apply() {
  const { id } = useParams();
  const job = mockJobs.find((j) => j.id === id);

  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState({ resume: null, supporting: null });

  const deptOptions = useMemo(
    () => [
      { value: "", label: "Select department", disabled: true },
      ...Array.from(new Set(mockJobs.map((j) => j.department))).map((d) => ({
        value: d,
        label: d,
      })),
    ],
    []
  );

  if (!job) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-4xl px-6 py-14 lg:px-10">
          <EmptyState
            title="Job not found"
            description="Select a job from the job listings before applying."
            actionLabel="Browse jobs"
            onAction={() => (window.location.href = "/jobs")}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to job details
        </Link>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
              Online Application
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Apply for {job.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{job.department}</Badge>
            <Badge tone="accent">{job.employmentType}</Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First Name" name="firstName" placeholder="e.g., Alex" />
                <Input label="Last Name" name="lastName" placeholder="e.g., Rivera" />
                <Input label="Email Address" name="email" type="email" placeholder="you@email.com" />
                <Input label="Mobile Number" name="phone" placeholder="+63…" />
                <Select
                  label="Preferred Department"
                  name="department"
                  defaultValue={job.department}
                  options={deptOptions}
                />
                <Input label="Current Location" name="location" placeholder="City, Province" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resume & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <FileField
                  label="Resume (PDF/DOC)"
                  name="resume"
                  file={files.resume}
                  onChange={(f) => setFiles((s) => ({ ...s, resume: f }))}
                />
                <FileField
                  label="Supporting Documents (optional)"
                  name="supporting"
                  file={files.supporting}
                  onChange={(f) => setFiles((s) => ({ ...s, supporting: f }))}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                This is UI-only. Files are not uploaded yet—ready for future API integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="LinkedIn Profile (optional)" name="linkedin" placeholder="https://linkedin.com/in/…" />
                <Input label="Portfolio / Website (optional)" name="portfolio" placeholder="https://…" />
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="coverLetter">
                    Short Cover Note (optional)
                  </label>
                  <textarea
                    id="coverLetter"
                    className="min-h-28 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                    placeholder="Tell us briefly why you're a great fit…"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              By submitting, you confirm the information provided is accurate (placeholder consent UI).
            </p>
            <div className="flex gap-2">
              <Button as={Link} to="/jobs" variant="outline">
                Cancel
              </Button>
              <Button variant="accent" onClick={() => setOpen(true)}>
                Submit application
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={open}
        title="Application submitted (placeholder)"
        description="No backend yet—this confirms the frontend flow is complete."
        onClose={() => setOpen(false)}
      >
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Job: <span className="font-semibold text-slate-900">{job.title}</span>
          </p>
          <p>
            Resume:{" "}
            <span className="font-semibold text-slate-900">
              {files.resume?.name || "Not selected"}
            </span>
          </p>
          <p>
            Supporting:{" "}
            <span className="font-semibold text-slate-900">
              {files.supporting?.name || "Not selected"}
            </span>
          </p>
        </div>
      </Modal>
    </div>
  );
}

function FileField({ label, name, file, onChange }) {
  const id = name;
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor={id}>
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--artms-border)] bg-white text-sm text-slate-600 transition hover:bg-slate-50"
      >
        <FiUploadCloud className="text-xl text-slate-500" aria-hidden="true" />
        <span className="font-semibold text-slate-700">
          {file?.name || "Click to choose a file"}
        </span>
        <span className="text-xs text-slate-500">UI only</span>
      </label>
      <input
        id={id}
        name={name}
        type="file"
        className="sr-only"
        onChange={(e) => onChange?.(e.target.files?.[0] || null)}
      />
    </div>
  );
}

