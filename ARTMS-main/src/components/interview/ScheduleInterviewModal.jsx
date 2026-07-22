/**
 * ScheduleInterviewModal
 * ─────────────────────
 * Opens a form to schedule an interview for a selected applicant and
 * automatically sends the email invitation on save via the backend.
 *
 * Props:
 *   open                bool
 *   onClose             fn
 *   onSaved             fn(newInterview)   called after successful save
 *   applicants          array   (optional) pre-loaded list of applicants
 *                               [{id, first_name, last_name, email, job_posting_id, jobPosting}]
 *                               If not supplied, the modal fetches from the API.
 *   prefillApplicantId  number|null        pre-select an applicant (optional)
 */
import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import interviewService from "../../services/interviewService";
import applicantService from "../../services/applicantService";

const STAGE_OPTIONS = [
  { value: "", label: "Select stage…", disabled: true },
  { value: "interview_1", label: "Interview 1" },
  { value: "interview_2", label: "Interview 2" },
  { value: "final",       label: "Final Interview" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Select type…", disabled: true },
  { value: "in_person", label: "In-Person" },
  { value: "online",    label: "Online / Video Call" },
  { value: "phone",     label: "Phone Call" },
];

const EMPTY = {
  applicant_id:    "",
  job_posting_id:  "",
  interview_stage: "",
  interview_type:  "",
  scheduled_at:    "",
  location:        "",
  meeting_link:    "",
};

export default function ScheduleInterviewModal({
  open,
  onClose,
  onSaved,
  applicants: applicantsProp = [],
  prefillApplicantId = null,
}) {
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // ── Load applicants ────────────────────────────────────────────────────
  // If a list was passed in (e.g. from ApplicantDetails), use it directly.
  // Otherwise fetch from API when the modal opens.
  useEffect(() => {
    if (!open) { setSent(false); setErrors({}); return; }

    if (applicantsProp.length > 0) {
      setApplicants(applicantsProp);
    } else {
      setLoadingApplicants(true);
      // Fetch all applicants that are in a schedulable state
      applicantService
        .getAll({ per_page: 200, is_shortlisted: true })
        .then(({ data }) => {
          const rows = data.data ?? data;
          setApplicants(rows);
        })
        .catch(() => setApplicants([]))
        .finally(() => setLoadingApplicants(false));
    }
  }, [open]);

  // Keep in sync if the parent updates the list after open
  useEffect(() => {
    if (applicantsProp.length > 0) setApplicants(applicantsProp);
  }, [applicantsProp]);

  // Build applicant options for the select
  const applicantOptions = [
    { value: "", label: loadingApplicants ? "Loading applicants…" : "Select applicant…", disabled: true },
    ...applicants.map((a) => ({
      value: a.id,
      label: `${a.first_name} ${a.last_name} — ${a.jobPosting?.jobLibrary?.title ?? a.jobPosting?.title ?? ""}`,
    })),
  ];

  // Pre-fill applicant when opened with a specific one
  useEffect(() => {
    if (!open) return;
    if (prefillApplicantId) {
      const a = applicants.find((x) => x.id === prefillApplicantId);
      setForm((f) => ({
        ...EMPTY,
        applicant_id:   prefillApplicantId,
        job_posting_id: a?.job_posting_id ?? "",
      }));
    } else {
      setForm(EMPTY);
    }
  }, [open, prefillApplicantId, applicants]);

  // When applicant changes, auto-fill job_posting_id
  function handleApplicantChange(id) {
    const a = applicants.find((x) => String(x.id) === String(id));
    setForm((f) => ({
      ...f,
      applicant_id:   id,
      job_posting_id: a?.job_posting_id ?? "",
    }));
  }

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const e = {};
    if (!form.applicant_id)    e.applicant_id    = "Required";
    if (!form.interview_stage) e.interview_stage = "Required";
    if (!form.interview_type)  e.interview_type  = "Required";
    if (!form.scheduled_at)    e.scheduled_at    = "Required";
    if (form.interview_type === "online" && !form.meeting_link)
      e.meeting_link = "Meeting link is required for online interviews";
    if (form.interview_type === "in_person" && !form.location)
      e.location = "Location is required for in-person interviews";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        applicant_id:    Number(form.applicant_id),
        job_posting_id:  Number(form.job_posting_id),
        interview_stage: form.interview_stage,
        interview_type:  form.interview_type,
        scheduled_at:    form.scheduled_at,
        location:        form.location || null,
        meeting_link:    form.meeting_link || null,
      };
      const { data } = await interviewService.create(payload);
      setSent(true);
      onSaved?.(data.interview);
    } catch (err) {
      const serverErrors = err.response?.data?.errors ?? {};
      setErrors(serverErrors);
      if (!Object.keys(serverErrors).length) {
        setErrors({ _general: err.response?.data?.message ?? "Failed to schedule interview." });
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (sent) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Interview Scheduled"
        footer={
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-3xl">
            ✉️
          </span>
          <p className="font-bold text-slate-900">Invitation Sent!</p>
          <p className="text-sm text-slate-500">
            The interview has been scheduled and an email invitation has been
            sent to the applicant automatically.
          </p>
        </div>
      </Modal>
    );
  }

  // ── Form screen ───────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Interview & Send Invitation"
      description="An email invitation will be sent to the applicant automatically."
      className="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button form="schedule-form" type="submit" disabled={loading}>
            {loading ? "Scheduling…" : "Schedule & Send Invitation ✉️"}
          </Button>
        </div>
      }
    >
      <form
        id="schedule-form"
        onSubmit={handleSubmit}
        className="space-y-4 overflow-y-auto max-h-[60vh] pr-1"
      >
        {errors._general && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errors._general}
          </div>
        )}

        {/* Applicant */}
        <Select
          label="Applicant"
          name="applicant_id"
          value={form.applicant_id}
          options={applicantOptions}
          onChange={(e) => handleApplicantChange(e.target.value)}
          error={errors.applicant_id}
        />

        {/* Stage + Type */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Interview Stage"
            name="interview_stage"
            value={form.interview_stage}
            options={STAGE_OPTIONS}
            onChange={(e) => set("interview_stage", e.target.value)}
            error={errors.interview_stage}
          />
          <Select
            label="Interview Type"
            name="interview_type"
            value={form.interview_type}
            options={TYPE_OPTIONS}
            onChange={(e) => set("interview_type", e.target.value)}
            error={errors.interview_type}
          />
        </div>

        {/* Date & Time */}
        <Input
          label="Date & Time"
          name="scheduled_at"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => set("scheduled_at", e.target.value)}
          error={errors.scheduled_at}
        />

        {/* Location (in-person) */}
        {(form.interview_type === "in_person" || form.interview_type === "") && (
          <Input
            label="Location"
            name="location"
            placeholder="e.g. Room 301, Head Office"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            error={errors.location}
          />
        )}

        {/* Meeting link (online) */}
        {form.interview_type === "online" && (
          <Input
            label="Meeting Link"
            name="meeting_link"
            type="url"
            placeholder="https://meet.google.com/..."
            value={form.meeting_link}
            onChange={(e) => set("meeting_link", e.target.value)}
            error={errors.meeting_link}
          />
        )}

        {/* Info box */}
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <span className="font-bold">📧 Auto Email:</span> An invitation email
          with date, time, and{" "}
          {form.interview_type === "online" ? "meeting link" : "location"} will
          be sent to the applicant immediately after scheduling.
        </div>
      </form>
    </Modal>
  );
}
