import { useEffect, useRef, useState } from "react";
import { X, ArrowLeft, CheckCircle, File, Loader2, UploadCloud, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import axios from "axios";
import applicantService from "../services/applicantService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const EMPTY_FORM = {
  firstName: "", lastName: "", middleName: "",
  email: "", phone: "", dateOfBirth: "",
  gender: "", civilStatus: "", nationality: "",
  address: "", coverLetter: "",
};

const GENDERS = ["", "Male", "Female", "Non-binary", "Prefer not to say"];
const CIVIL_STATUSES = ["", "Single", "Married", "Divorced", "Widowed", "Separated", "Annulled"];

/**
 * ApplyModal - Slide-in application form panel
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {object} job - Job posting data
 * @param {function} onClose - Close callback
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
  const fileInputRef = useRef();

  // Reset form when modal opens
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
    }
  }, [open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleResumeChange = async (file) => {
    if (!file) return;
    
    // Check file size (max 10MB = 10485760 bytes)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setParseMsg({ 
        type: "error", 
        text: `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is 10 MB.` 
      });
      return;
    }
    
    // Check file extension
    const allowedExt = ['pdf', 'doc', 'docx', 'txt'];
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
    
    if (!allowedExt.includes(fileExt)) {
      setParseMsg({ 
        type: "error", 
        text: "Please upload a PDF, DOCX, DOC, or TXT file." 
      });
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
        setParseMsg({ type: "success",
          text: `Resume parsed — ${filled} field${filled !== 1 ? "s" : ""} auto-filled. Review and correct anything that looks off.` });
      } else {
        setParsedCount(0);
        setParseMsg({ type: "warn",
          text: res.data.message || "Couldn't fully parse the resume. Fill in the remaining fields manually." });
      }
    } catch (err) {
      console.error("Resume parse error:", err);
      console.error("Response data:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.resume?.[0];
      if (errorMsg) {
        setParseMsg({ type: "error", text: errorMsg });
      } else {
        setParseMsg({ type: "warn", text: "Resume uploaded but couldn't be auto-parsed. Fill in the fields manually." });
      }
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
    if (!consent)    { setSubmitError("You must accept the informed consent to proceed."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("job_posting_id",   job.id);
      fd.append("first_name",       form.firstName);
      fd.append("last_name",        form.lastName);
      fd.append("middle_name",      form.middleName);
      fd.append("email",            form.email);
      fd.append("phone",            form.phone);
      fd.append("date_of_birth",    form.dateOfBirth);
      fd.append("gender",           form.gender);
      fd.append("civil_status",     form.civilStatus);
      fd.append("nationality",      form.nationality);
      fd.append("address",          form.address);
      fd.append("resume",           resumeFile);
      fd.append("informed_consent", "1");
      const res = await applicantService.submit(fd);
      setSubmitted({ application_id: res.data.application_id });
    } catch (err) {
      console.error("Form submission error:", err); // ADD THIS LINE
      console.log("Response data:", err.response?.data); // ADD THIS LINE
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

  if (!job) return null;

  const jobTitle  = job.job_library?.job_title ?? "this position";
  const dept      = job.department?.department_name ?? job.department?.name ?? "N/A";
  const vacancies = job.vacancies_count ?? 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-full bg-white shadow-2xl transition-transform duration-500 ease-out sm:w-[600px] lg:w-[700px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-br from-[#F97316] to-[#ea6a0a] px-6 py-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Online Application</span>
                </div>
                <h2 className="text-2xl font-extrabold">Apply for {jobTitle}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-white/20 text-white">{dept}</Badge>
                  <Badge className="bg-white/20 text-white">
                    {vacancies} {vacancies > 1 ? "openings" : "opening"}
                  </Badge>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {submitted ? (
              // Success Screen
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="mt-6 text-2xl font-extrabold text-[#111A62]">Application Submitted!</h3>
                <p className="mt-3 text-slate-600">Your application has been received. Use the reference number below to track your status.</p>
                <div className="mt-6 inline-block rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Application ID</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-wider text-emerald-700">{submitted.application_id}</p>
                  <p className="mt-1 text-xs text-slate-500">Save this — you'll need it to track your application.</p>
                </div>
                <Button onClick={onClose} className="mt-8 bg-[#111A62] hover:bg-[#0d1550]">
                  Close & Browse More Jobs
                </Button>
              </div>
            ) : (
              // Application Form
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Resume Upload */}
                <Card className="border-2 border-dashed border-[#111A62]/20">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold text-[#111A62]">Upload Your Resume</CardTitle>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Upload first — we'll auto-fill the fields below. PDF, DOCX, DOC, TXT · Max 10 MB
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {!resumeFile ? (
                      <label htmlFor="resume-upload"
                        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center transition hover:border-[#111A62]/40 hover:bg-[#111A62]/5">
                        <UploadCloud size={28} className="text-[#4D569E]" />
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Click to choose a file</p>
                          <p className="mt-0.5 text-xs text-slate-400">PDF, DOCX, DOC, or TXT</p>
                        </div>
                        <input id="resume-upload" ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt"
                          className="sr-only" onChange={(e) => handleResumeChange(e.target.files?.[0] ?? null)} />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <File size={18} className="shrink-0 text-[#4D569E]" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{resumeFile.name}</p>
                            <p className="text-xs text-slate-400">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button type="button" onClick={removeResume}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {parsing && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#111A62]/10 bg-[#111A62]/5 px-3 py-2 text-sm text-[#111A62]">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" /> Analyzing your resume with AI…
                      </div>
                    )}
                    {!parsing && parseMsg && (
                      <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                        parseMsg.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : parseMsg.type === "warn"  ? "border-amber-100 bg-amber-50 text-amber-700"
                        : "border-red-100 bg-red-50 text-red-600"}`}>
                        {parseMsg.type === "success"
                          ? <CheckCircle size={14} className="mt-0.5 shrink-0" />
                          : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                        {parseMsg.text}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold text-[#111A62]">Personal Information</CardTitle>
                    <p className="mt-0.5 text-xs text-slate-500">Fields marked <span className="text-red-500">*</span> are required.</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="First Name" required error={fieldErrors.firstName}>
                        <input value={form.firstName} onChange={set("firstName")} className={inputCls(fieldErrors.firstName)} required />
                      </Field>
                      <Field label="Last Name" required error={fieldErrors.lastName}>
                        <input value={form.lastName} onChange={set("lastName")} className={inputCls(fieldErrors.lastName)} required />
                      </Field>
                      <Field label="Middle Name" error={fieldErrors.middleName} className="sm:col-span-2">
                        <input value={form.middleName} onChange={set("middleName")} className={inputCls(fieldErrors.middleName)} />
                      </Field>
                      <Field label="Email Address" required error={fieldErrors.email}>
                        <input type="email" value={form.email} onChange={set("email")} className={inputCls(fieldErrors.email)} required />
                      </Field>
                      <Field label="Mobile Number" error={fieldErrors.phone}>
                        <input value={form.phone} onChange={set("phone")} placeholder="09xxxxxxxxx" className={inputCls(fieldErrors.phone)} />
                      </Field>
                      <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
                        <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls(fieldErrors.dateOfBirth)} />
                      </Field>
                      <Field label="Gender" error={fieldErrors.gender}>
                        <select value={form.gender} onChange={set("gender")} className={inputCls(fieldErrors.gender)}>
                          {GENDERS.map((g) => <option key={g} value={g}>{g || "Select gender"}</option>)}
                        </select>
                      </Field>
                      <Field label="Civil Status" error={fieldErrors.civilStatus}>
                        <select value={form.civilStatus} onChange={set("civilStatus")} className={inputCls(fieldErrors.civilStatus)}>
                          {CIVIL_STATUSES.map((s) => <option key={s} value={s}>{s || "Select civil status"}</option>)}
                        </select>
                      </Field>
                      <Field label="Nationality" error={fieldErrors.nationality}>
                        <input value={form.nationality} onChange={set("nationality")} placeholder="e.g. Filipino" className={inputCls(fieldErrors.nationality)} />
                      </Field>
                      <Field label="Address" error={fieldErrors.address} className="sm:col-span-2">
                        <input value={form.address} onChange={set("address")} placeholder="City, Province, Philippines" className={inputCls(fieldErrors.address)} />
                      </Field>
                    </div>
                  </CardContent>
                </Card>

                {/* Cover Letter */}
                <Card>
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold text-[#111A62]">
                      Cover Note <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <textarea rows={4} value={form.coverLetter} onChange={set("coverLetter")}
                      placeholder="Tell us briefly why you're a great fit for this role…"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#111A62] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111A62]/20" />
                  </CardContent>
                </Card>

                {/* Consent */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#111A62]" />
                    <span className="text-sm text-slate-700 leading-relaxed">
                      I confirm that all information provided is accurate and true. I consent to ARTMS collecting and
                      processing my personal data for recruitment purposes.
                      <span className="text-red-500"> *</span>
                    </span>
                  </label>
                </div>

                {/* Error Banner */}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {submitError}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-3">
                  <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-slate-300">
                    Cancel
                  </Button>
                  <button type="submit" disabled={submitting || parsing}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea6a0a] disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Helper Components
function inputCls(hasError) {
  return [
    "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800",
    "placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2",
    hasError ? "border-red-300 focus:border-red-400 focus:ring-red-200"
             : "border-slate-200 focus:border-[#111A62] focus:ring-[#111A62]/20",
  ].join(" ");
}

function Field({ label, required, error, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
