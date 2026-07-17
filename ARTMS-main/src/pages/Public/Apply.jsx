import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiUploadCloud, FiLoader } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import AlertModal from "../../components/ui/AlertModal";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Apply() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState({ resume: null, supporting: null });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    location: "",
    linkedin: "",
    portfolio: "",
    coverLetter: "",
  });
  const [alertModal, setAlertModal] = useState({ open: false, variant: "success", title: "", message: "" });

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/public/job-postings/${id}`);
      const jobData = response.data.posting || response.data;
      setJob(jobData);
      setFormData((prev) => ({
        ...prev,
        department: jobData.department?.name || "",
      }));
    } catch (error) {
      console.error("Error fetching job:", error);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;

    setFiles((s) => ({ ...s, resume: file }));
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await axios.post(`${API_URL}/public/parse-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success && response.data.data) {
        const parsed = response.data.data;
        
        setFormData((prev) => ({
          ...prev,
          firstName: parsed.firstName || prev.firstName,
          lastName: parsed.lastName || prev.lastName,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          location: parsed.location || prev.location,
        }));

        setAlertModal({
          open: true,
          variant: "success",
          title: "Resume Parsed Successfully",
          message: "Your resume has been analyzed and form fields have been auto-filled. Please review and edit as needed.",
        });
      }
    } catch (error) {
      console.error("Error parsing resume:", error);
      setAlertModal({
        open: true,
        variant: "warning",
        title: "Partial Parsing",
        message: "We couldn't fully parse your resume. Please fill in the remaining fields manually.",
      });
    } finally {
      setParsing(false);
    }
  };

  const deptOptions = useMemo(
    () => [
      { value: "", label: "Select department", disabled: true },
      { value: job?.department?.name || "Operations", label: job?.department?.name || "Operations" },
    ],
    [job]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <section className="mx-auto max-w-4xl px-6 py-14 lg:px-10">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#111A62]"></div>
            <p className="text-sm font-medium text-slate-600">Loading application form...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
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

  const jobTitle = job.job_library?.job_title || "this position";
  const department = job.department?.name || "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
        <Link
          to={`/jobs/${job.id}`}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#111A62]"
        >
          <FiArrowLeft className="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          Back to Job Details
        </Link>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F97316]/10 px-4 py-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                Online Application
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111A62] sm:text-4xl">
              Apply for {jobTitle}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info" className="bg-[#111A62]/10 text-[#111A62]">{department}</Badge>
            <Badge tone="accent" className="bg-[#F97316]/10 text-[#F97316]">{job.vacancies_count} {job.vacancies_count > 1 ? "openings" : "opening"}</Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-[#111A62]">Applicant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input 
                  label="First Name" 
                  name="firstName" 
                  placeholder="e.g., Alex" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <Input 
                  label="Last Name" 
                  name="lastName" 
                  placeholder="e.g., Rivera" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                <Input 
                  label="Email Address" 
                  name="email" 
                  type="email" 
                  placeholder="you@email.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input 
                  label="Mobile Number" 
                  name="phone" 
                  placeholder="+63…" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Select
                  label="Preferred Department"
                  name="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  options={deptOptions}
                />
                <Input 
                  label="Current Location" 
                  name="location" 
                  placeholder="City, Province" 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-[#111A62]">Resume & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <FileField
                  label="Resume (PDF/Image)"
                  name="resume"
                  file={files.resume}
                  parsing={parsing}
                  onChange={(f) => handleResumeUpload(f)}
                />
                <FileField
                  label="Supporting Documents (optional)"
                  name="supporting"
                  file={files.supporting}
                  onChange={(f) => setFiles((s) => ({ ...s, supporting: f }))}
                />
              </div>
              {parsing && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#111A62]/5 border border-[#111A62]/10 px-3 py-2 text-sm text-[#111A62]">
                  <FiLoader className="animate-spin" />
                  <span>Analyzing your resume with AI...</span>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Upload your resume and we'll automatically extract information to fill the form fields.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-[#111A62]">Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input 
                  label="LinkedIn Profile (optional)" 
                  name="linkedin" 
                  placeholder="https://linkedin.com/in/…" 
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                />
                <Input 
                  label="Portfolio / Website (optional)" 
                  name="portfolio" 
                  placeholder="https://…" 
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="coverLetter">
                    Short Cover Note (optional)
                  </label>
                  <textarea
                    id="coverLetter"
                    className="min-h-28 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                    placeholder="Tell us briefly why you're a great fit…"
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              By submitting, you confirm the information provided is accurate.
            </p>
            <div className="flex gap-2">
              <Button as={Link} to="/jobs" variant="outline" className="border-slate-300">
                Cancel
              </Button>
              <Button 
                variant="accent" 
                onClick={() => setOpen(true)}
                className="bg-[#F97316] hover:bg-[#ea6a0a]"
              >
                Submit Application
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
            Job: <span className="font-semibold text-slate-900">{jobTitle}</span>
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

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
      />
    </div>
  );
}

function FileField({ label, name, file, parsing, onChange }) {
  const id = name;
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor={id}>
        {label}
      </label>
      <label
        htmlFor={id}
        className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed ${
          parsing ? "border-blue-300 bg-blue-50" : "border-[var(--artms-border)] bg-white"
        } text-sm text-slate-600 transition hover:bg-slate-50`}
      >
        {parsing ? (
          <FiLoader className="text-xl text-blue-500 animate-spin" aria-hidden="true" />
        ) : (
          <FiUploadCloud className="text-xl text-slate-500" aria-hidden="true" />
        )}
        <span className="font-semibold text-slate-700">
          {file?.name || "Click to choose a file"}
        </span>
        {parsing && <span className="text-xs text-blue-600">Parsing...</span>}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={(e) => onChange?.(e.target.files?.[0] || null)}
        disabled={parsing}
      />
    </div>
  );
}
