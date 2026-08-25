import { useEffect, useRef, useState } from "react";
import {
  X, CheckCircle, File, Loader2, UploadCloud, AlertTriangle,
  MapPin, Briefcase, Clock, ChevronUp, User, Mail, Phone,
  Calendar, ChevronsUpDown, Globe, Home, FileText, CheckCircle2, AlertCircle
} from "lucide-react";
import axios from "axios";
import applicantService from "../services/applicantService";
import BirthDatePicker from "../components/ui/BirthDatePicker";
import Select from "../components/ui/Select";
import { API_BASE_URL as API_URL } from "../services/api";

const EMPTY_FORM = {
  firstName: "", lastName: "", middleName: "",
  email: "", phone: "", dateOfBirth: "",
  gender: "", civilStatus: "", nationality: "",
  address: "", coverLetter: "",
};

const GENDERS = ["", "Male", "Female"];
const CIVIL_STATUSES = ["", "Single", "Married", "Divorced", "Widowed", "Separated", "Annulled"];

/**
 * ApplyModal — Inline expandable application form rendered within the job listing page.
 * No overlay. Expands below the job card header so the applicant always sees the job they're applying for.
 */
export default function ApplyModal({ open, job, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [resumeFile, setResumeFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState(null);
  const [parsedCount, setParsedCount] = useState(0);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState("empty");
  const [step, setStep] = useState(1); // 1: resume, 2: personal info, 3: review & submit
  const fileInputRef = useRef();
  const formRef = useRef();

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setResumeFile(null);
      setParsing(false);
      setParseMsg(null);
      setParsedCount(0);
      setConsent(false);
      setSubmitting(false);
      setSubmitError(null);
      setSubmitted(null);
      setFieldErrors({});
      setEmailStatus("empty");
      setStep(1);
      // Scroll the form into view smoothly
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleResumeChange = async (file) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setParseMsg({ type: "error", text: `File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max is 10 MB.` });
      return;
    }
    const allowedExt = ["pdf", "doc", "docx", "txt"];
    const ext = file.name.toLowerCase().split(".").pop();
    if (!allowedExt.includes(ext)) {
      setParseMsg({ type: "error", text: "Please upload a PDF, DOCX, DOC, or TXT file." });
      return;
    }
    setResumeFile(file);
    setParseMsg(null);
    setFieldErrors({});
    setParsedCount(0);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await axios.post(`${API_URL}/public/parse-resume`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success && res.data.data) {
        const p = res.data.data;
        const next = {
          firstName: p.firstName || "", lastName: p.lastName || "",
          middleName: p.middleName || "", email: p.email || "",
          phone: p.phone || "", address: p.address || "",
          gender: p.gender || "", dateOfBirth: p.dateOfBirth || "",
          nationality: p.nationality || "", civilStatus: p.civilStatus || "",
        };
        const filled = Object.values(next).filter((v) => v.trim() !== "").length;
        setParsedCount(filled);
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(next).filter(([, v]) => v !== "")),
        }));
        setParseMsg({
          type: "success",
          text: `✓ Resume parsed — ${filled} field${filled !== 1 ? "s" : ""} auto-filled. Review and correct if needed.`,
        });
      } else {
        setParseMsg({ type: "warn", text: res.data.message || "Couldn't fully parse the resume. Fill in the remaining fields manually." });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.resume?.[0];
      setParseMsg({ type: msg ? "error" : "warn", text: msg || "Resume uploaded but couldn't be auto-parsed. Fill in the fields manually." });
    } finally {
      setParsing(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null); setParseMsg(null); setParsedCount(0); setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    if (!resumeFile) { setSubmitError("Please upload your resume before submitting."); return; }
    if (!consent) { setSubmitError("You must accept the informed consent to proceed."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("job_posting_id", job.id);
      fd.append("first_name", form.firstName);
      fd.append("last_name", form.lastName);
      fd.append("middle_name", form.middleName);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("date_of_birth", form.dateOfBirth);
      fd.append("gender", form.gender);
      fd.append("civil_status", form.civilStatus);
      fd.append("nationality", form.nationality);
      fd.append("address", form.address);
      fd.append("resume", resumeFile);
      fd.append("informed_consent", "1");
      const res = await applicantService.submit(fd);
      setSubmitted({ application_id: res.data.application_id });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const mapped = {};
        Object.entries(errors).forEach(([k, msgs]) => {
          mapped[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = msgs[0];
        });
        setFieldErrors(mapped);
        setSubmitError("Please fix the errors below and try again.");
      } else {
        setSubmitError(err.response?.data?.message ?? "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!job || !open) return null;

  const jobTitle = job.job_library?.job_title ?? "this position";
  const deptName = job.department?.department_name ?? job.department?.name ?? "N/A";
  const vacancies = job.vacancies_count ?? 1;
  const location = job.location || "Remote";
  const deadline = job.closing_date
    ? new Date(job.closing_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div ref={formRef} className="mt-0 overflow-hidden rounded-b-2xl border-t-0">
      {/* ── Job Confirmation Banner ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#111A62] to-[#1e2d8a] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* "Applying for" label */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
              You are applying for
            </p>
            <h3 className="text-xl font-extrabold text-white leading-tight">{jobTitle}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#F97316]" />
                {location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#F97316]" />
                {deptName}
              </span>
              <span className="flex items-center gap-1.5">
                <ChevronsUpDown className="h-3.5 w-3.5 text-[#F97316]" />
                {vacancies} {vacancies > 1 ? "Vacancies" : "Vacancy"}
              </span>
              {deadline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#F97316]" />
                  Apply by {deadline}
                </span>
              )}
            </div>
          </div>
          {/* Collapse / Close Button */}
          <button
            onClick={onClose}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Close Form
          </button>
        </div>
      </div>

      {/* ── Application Form Body ───────────────────────────────── */}
      <div className="bg-[#FAFBFF] px-6 py-6">
        {submitted ? (
          /* ── Success Screen ─────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="mt-5 text-2xl font-extrabold text-[#111A62]">Application Submitted!</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Your application for <span className="font-bold text-[#111A62]">{jobTitle}</span> has been received.
              Use the reference number below to track your status.
            </p>
            <div className="mt-6 inline-block rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-10 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Application ID</p>
              <p className="mt-1 text-2xl font-extrabold tracking-wider text-emerald-700">{submitted.application_id}</p>
              <p className="mt-1 text-xs text-slate-400">Save this — you'll need it to track your application.</p>
            </div>
            <button
              onClick={onClose}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#111A62] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0d1550] transition"
            >
              <ChevronUp className="h-4 w-4" />
              Collapse & Browse More Jobs
            </button>
          </div>
        ) : (
          /* ── Application Form ───────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* ── Step 1: Resume Upload ──────────────────────────── */}
            <div>
              <SectionHeader icon={<UploadCloud className="h-4 w-4" />} title="Upload Resume" subtitle="Upload first — we'll auto-fill your details. PDF, DOCX, DOC, TXT · Max 10 MB" />
              <div className="mt-3">
                {!resumeFile ? (
                  <label
                    htmlFor="resume-upload-inline"
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#111A62]/20 bg-white px-6 py-8 text-center transition hover:border-[#111A62]/40 hover:bg-[#111A62]/5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111A62]/10">
                      <UploadCloud className="h-7 w-7 text-[#111A62]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111A62]">Click to upload your resume</p>
                      <p className="mt-0.5 text-xs text-slate-400">PDF, DOCX, DOC, or TXT files accepted</p>
                    </div>
                    <input
                      id="resume-upload-inline"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="sr-only"
                      onChange={(e) => handleResumeChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#111A62]/15 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111A62]/10">
                        <File className="h-5 w-5 text-[#111A62]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{resumeFile.name}</p>
                        <p className="text-xs text-slate-400">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeResume}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {parsing && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[#111A62]/15 bg-[#111A62]/5 px-4 py-3 text-sm font-medium text-[#111A62]">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Analyzing your resume with AI — this takes a few seconds…
                  </div>
                )}
                {!parsing && parseMsg && (
                  <div className={`mt-3 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${parseMsg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : parseMsg.type === "warn" ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}>
                    {parseMsg.type === "success"
                      ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{parseMsg.text}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <SectionHeader icon={<User className="h-4 w-4" />} title="Personal Information" subtitle={<>Fields marked <span className="text-red-500">*</span> are required.</>} />

              {/* Row 1: First / Middle / Last — 3-column grid */}
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="First Name" required error={fieldErrors.firstName}>
                  <InlineInput icon={<User className="h-4 w-4 text-slate-400" />}>
                    <input value={form.firstName} onChange={set("firstName")} maxLength={50} className={inputCls(fieldErrors.firstName)} required />
                  </InlineInput>
                </Field>
                <Field label="Middle Name" error={fieldErrors.middleName}>
                  <InlineInput icon={<User className="h-4 w-4 text-slate-400" />}>
                    <input value={form.middleName} onChange={set("middleName")} maxLength={50} className={inputCls(fieldErrors.middleName)} />
                  </InlineInput>
                </Field>
                <Field label="Last Name" required error={fieldErrors.lastName}>
                  <InlineInput icon={<User className="h-4 w-4 text-slate-400" />}>
                    <input value={form.lastName} onChange={set("lastName")} maxLength={50} className={inputCls(fieldErrors.lastName)} required />
                  </InlineInput>
                </Field>
              </div>

              {/* Row 2: remaining fields — 2-column grid */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Email Address" required error={fieldErrors.email}>
                  <InlineInput icon={<Mail className="h-4 w-4 text-slate-400" />}>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({ ...f, email: val }));
                        if (!val) {
                          setEmailStatus("empty");
                        } else {
                          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                          setEmailStatus(emailRegex.test(val) ? "valid" : "invalid");
                        }
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: null }));
                        }
                      }} 
                      maxLength={100}
                      className={`${inputCls(fieldErrors.email)} ${
                        emailStatus === 'valid'
                          ? "!border-emerald-400 focus:!border-emerald-500 focus:!ring-emerald-200"
                          : emailStatus === 'invalid'
                          ? "!border-rose-400 focus:!border-rose-500 focus:!ring-rose-200 text-rose-600"
                          : ""
                      }`}
                      required 
                    />
                  </InlineInput>
                  <div className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${emailStatus === 'empty' && !fieldErrors.email ? 'h-0 opacity-0' : 'h-6 opacity-100'}`}>
                    {emailStatus === 'valid' && !fieldErrors.email && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 transition-all">
                        <CheckCircle2 size={14} className="animate-in zoom-in" /> 
                        <span className="animate-in fade-in slide-in-from-left-2 duration-300">Valid email format</span>
                      </div>
                    )}
                    {emailStatus === 'invalid' && !fieldErrors.email && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 transition-all">
                        <AlertCircle size={14} className="animate-pulse" /> 
                        <span className="animate-in fade-in slide-in-from-left-2 duration-300">Invalid email format</span>
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="Mobile Number" error={fieldErrors.phone}>
                  <InlineInput icon={<Phone className="h-4 w-4 text-slate-400" />}>
                    <input 
                      value={form.phone} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+() -]/g, '');
                        setForm((f) => ({ ...f, phone: val }));
                      }} 
                      maxLength={20}
                      placeholder="09xxxxxxxxx" 
                      className={inputCls(fieldErrors.phone)} 
                    />
                  </InlineInput>
                </Field>
                <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
                  <BirthDatePicker
                    value={form.dateOfBirth}
                    onChange={(val) => setForm((f) => ({ ...f, dateOfBirth: val }))}
                    placeholder="Select date of birth"
                  />
                </Field>
                <Field label="Gender" error={fieldErrors.gender}>
                  <Select
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    options={GENDERS.map((g) => ({ value: g, label: g || "Select gender" }))}
                    placeholder="Select gender"
                    error={fieldErrors.gender}
                  />
                </Field>
                <Field label="Civil Status" error={fieldErrors.civilStatus}>
                  <Select
                    value={form.civilStatus}
                    onChange={(e) => setForm((f) => ({ ...f, civilStatus: e.target.value }))}
                    options={CIVIL_STATUSES.map((s) => ({ value: s, label: s || "Select civil status" }))}
                    placeholder="Select civil status"
                    error={fieldErrors.civilStatus}
                  />
                </Field>
                <Field label="Nationality" error={fieldErrors.nationality}>
                  <InlineInput icon={<Globe className="h-4 w-4 text-slate-400" />}>
                    <input value={form.nationality} onChange={set("nationality")} maxLength={100} placeholder="e.g. Filipino" className={inputCls(fieldErrors.nationality)} />
                  </InlineInput>
                </Field>
                <Field label="Address" error={fieldErrors.address} className="sm:col-span-2">
                  <InlineInput icon={<Home className="h-4 w-4 text-slate-400" />}>
                    <input value={form.address} onChange={set("address")} maxLength={100} placeholder="City, Province, Philippines" className={inputCls(fieldErrors.address)} />
                  </InlineInput>
                </Field>
              </div>
            </div>

            {/* ── Step 3: Cover Note ─────────────────────────────── */}
            <div>
              <SectionHeader
                icon={<FileText className="h-4 w-4" />}
                title={<>Cover Note <span className="text-xs font-normal text-slate-400">(optional)</span></>}
                subtitle="Tell us briefly why you're a great fit for this role."
              />
              <textarea
                rows={4}
                value={form.coverLetter}
                onChange={set("coverLetter")}
                maxLength={500}
                placeholder={`Why are you a great fit for the ${jobTitle} role? (Max 500 characters)`}
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#111A62] focus:outline-none focus:ring-2 focus:ring-[#111A62]/20 transition"
              />
              <div className="mt-1.5 flex justify-end">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${form.coverLetter?.length >= 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {form.coverLetter?.length || 0} / 500
                </span>
              </div>
            </div>

            {/* ── Informed Consent ───────────────────────────────── */}
            <div className="rounded-2xl border border-[#111A62]/15 bg-[#111A62]/5 px-5 py-4">
              <label className="flex cursor-pointer items-start gap-3.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#111A62]"
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I confirm that all information provided is accurate and true. I consent to ARTMS collecting and processing
                  my personal data for recruitment purposes as governed by the Data Privacy Act of 2012 (RA 10173).
                  <span className="text-red-500"> *</span>
                </span>
              </label>
            </div>

            {/* ── Error Banner ───────────────────────────────────── */}
            {submitError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* ── Submit & Cancel ────────────────────────────────── */}
            <div className="flex gap-3 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ChevronUp className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || parsing}
                className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#ea6a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting application…</>
                  : <>Submit Application for {jobTitle}</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Helper Sub-components ────────────────────────────────────────── */

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#111A62]/10 text-[#111A62]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-[#111A62]">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function InlineInput({ icon, children }) {
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3">{icon}</span>
      <div className="w-full [&>input]:pl-9 [&>input]:pr-3">{children}</div>
    </div>
  );
}

function inputCls(hasError) {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800",
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 transition",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
      : "border-slate-200 focus:border-[#111A62] focus:ring-[#111A62]/20",
  ].join(" ");
}

function selectCls(hasError) {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800",
    "focus:outline-none focus:ring-2 transition appearance-none",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
      : "border-slate-200 focus:border-[#111A62] focus:ring-[#111A62]/20",
  ].join(" ");
}

function Field({ label, required, error, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
