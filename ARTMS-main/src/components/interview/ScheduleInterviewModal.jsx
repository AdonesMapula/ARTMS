/**
 * ScheduleInterviewModal.jsx
 * ──────────────────────────
 * Redesigned Schedule & Edit Interview Modal matching user reference design.
 * Features applicant banner, 2-column form layout, mode pills, tags, notes, summary box,
 * and automatic invitation email dispatch via Laravel backend.
 */

import { useState, useEffect, useMemo } from "react";
import { FiX, FiInfo, FiUser, FiCalendar, FiClock, FiPlus } from "react-icons/fi";
import Button from "../ui/Button";
import interviewService from "../../services/interviewService";
import applicantService from "../../services/applicantService";

const TYPE_OPTIONS = [
  { value: "Technical Assessment", label: "Technical Assessment" },
  { value: "Initial Screening",    label: "Initial Screening" },
  { value: "HR Interview",         label: "HR Interview" },
  { value: "Managerial Interview", label: "Managerial Interview" },
  { value: "Final Interview",      label: "Final Interview" },
];

const DURATION_OPTIONS = [
  { value: "15 Minutes", label: "15 Minutes" },
  { value: "30 Minutes", label: "30 Minutes" },
  { value: "45 Minutes", label: "45 Minutes" },
  { value: "60 Minutes", label: "60 Minutes" },
  { value: "90 Minutes", label: "90 Minutes" },
];

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM"
];

function buildScheduledAt(dateStr, timeStr) {
  const d = dateStr || new Date().toISOString().split("T")[0];
  let hours = 10;
  let minutes = 0;

  if (timeStr) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    }
  }

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${d} ${hh}:${mm}:00`;
}

const TIMEZONE_OPTIONS = [
  { value: "(GMT+08:00) Philippine Standard Time (Asia/Manila)", label: "(GMT+08:00) Philippine Standard Time (Asia/Manila)" },
  { value: "(GMT+00:00) UTC", label: "(GMT+00:00) UTC" },
  { value: "(GMT-05:00) Eastern Time (US & Canada)", label: "(GMT-05:00) Eastern Time (US & Canada)" },
];

const DEFAULT_APPLICANTS = [];

export default function ScheduleInterviewModal({
  open,
  onClose,
  onSaved,
  applicants: applicantsProp = DEFAULT_APPLICANTS,
  prefillApplicantId = null,
  prefillInterview = null,
}) {
  const [applicants, setApplicants]   = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [sent, setSent]               = useState(false);
  const [errors, setErrors]           = useState({});

  // Form state matching design
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [interviewType, setInterviewType]             = useState("Technical Assessment");
  const [interviewDate, setInterviewDate]             = useState("");
  const [interviewTime, setInterviewTime]             = useState("10:00 AM");
  const [timeZone, setTimeZone]                       = useState("(GMT+08:00) Philippine Standard Time (Asia/Manila)");
  const [interviewDuration, setInterviewDuration]     = useState("45 Minutes");
  
  const [interviewMode, setInterviewMode]             = useState("VIRTUAL"); // VIRTUAL | ON-SITE | PHONE
  const [interviewers, setInterviewers]               = useState(["Cristian Jeff", "Rye Nicholas"]);
  const [newInterviewer, setNewInterviewer]           = useState("");
  const [showAddInterviewer, setShowAddInterviewer]   = useState(false);

  const [contactEmail, setContactEmail]               = useState("hr@artms.com");
  const [contactNumber, setContactNumber]             = useState("+639171234567");
  const [notes, setNotes]                             = useState("");

  const [notifyApplicant, setNotifyApplicant]         = useState(true);
  const [notifyInterviewer, setNotifyInterviewer]     = useState(true);

  // Load applicants if not provided
  useEffect(() => {
    if (!open) { 
      setSent(false); 
      setErrors({}); 
      return; 
    }

    if (applicantsProp && applicantsProp.length > 0) {
      setApplicants((prev) => (prev === applicantsProp ? prev : applicantsProp));
    } else {
      let isMounted = true;
      setLoadingApps(true);
      applicantService
        .getAll({ per_page: 200 })
        .then(({ data }) => {
          if (isMounted) setApplicants(data.data ?? data ?? []);
        })
        .catch(() => {
          if (isMounted) setApplicants([]);
        })
        .finally(() => {
          if (isMounted) setLoadingApps(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [open, applicantsProp]);

  // Handle prefill applicant or existing interview
  useEffect(() => {
    if (!open) return;

    if (prefillInterview) {
      const appVal = prefillInterview.applicant_id || prefillInterview.applicant?.id || "";
      setSelectedApplicantId((prev) => (prev === appVal ? prev : appVal));
      if (prefillInterview.scheduled_at) {
        const dt = new Date(prefillInterview.scheduled_at);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        const dateVal = `${yyyy}-${mm}-${dd}`;
        setInterviewDate((prev) => (prev === dateVal ? prev : dateVal));
        
        let hh = dt.getHours();
        const m = String(dt.getMinutes()).padStart(2, "0");
        const ampm = hh >= 12 ? "PM" : "AM";
        hh = hh % 12 || 12;
        const timeVal = `${String(hh).padStart(2, "0")}:${m} ${ampm}`;
        setInterviewTime((prev) => (prev === timeVal ? prev : timeVal));
      }
      if (prefillInterview.interview_type === "in_person") setInterviewMode("ON-SITE");
      else if (prefillInterview.interview_type === "phone") setInterviewMode("PHONE");
      else setInterviewMode("VIRTUAL");
    } else if (prefillApplicantId) {
      setSelectedApplicantId((prev) => (prev === prefillApplicantId ? prev : prefillApplicantId));
    } else if (applicants.length > 0 && !selectedApplicantId) {
      const firstId = applicants[0].id;
      setSelectedApplicantId((prev) => (prev ? prev : firstId));
    }
  }, [open, prefillApplicantId, prefillInterview, applicants, selectedApplicantId]);

  // Current selected applicant object
  const currentApplicant = useMemo(() => {
    return applicants.find((a) => String(a.id) === String(selectedApplicantId)) || applicants[0] || null;
  }, [applicants, selectedApplicantId]);

  // Derived applicant info
  const applicantName = currentApplicant
    ? `${currentApplicant.first_name || ""} ${currentApplicant.last_name || ""}`.trim()
    : "Greg Baring Gotot";

  const applicantStage = currentApplicant?.status
    ? currentApplicant.status.replace(/_/g, " ")
    : "Screening";

  const jobCategory = currentApplicant?.job_posting?.job_library?.job_title ??
    currentApplicant?.job_posting?.title ??
    "Medical / Healthcare";

  const appDateFormatted = currentApplicant?.created_at
    ? new Date(currentApplicant.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Oct 12, 2023";

  // Add interviewer tag
  const addInterviewerTag = () => {
    if (newInterviewer.trim() && !interviewers.includes(newInterviewer.trim())) {
      setInterviewers([...interviewers, newInterviewer.trim()]);
      setNewInterviewer("");
      setShowAddInterviewer(false);
    }
  };

  const removeInterviewerTag = (name) => {
    setInterviewers(interviewers.filter((i) => i !== name));
  };

  const STAGE_LABELS = {
    technical_assessment: "Technical Assessment",
    initial_screening:    "Initial Screening",
    hr_interview:         "HR Interview",
    managerial_interview: "Managerial Interview",
    final:                "Final Interview",
    interview_1:          "Initial Interview",
    interview_2:          "Second Interview",
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApplicantId) {
      setErrors({ general: "Please select a candidate for this interview." });
      return;
    }

    setLoading(true);
    try {
      // Build ISO datetime
      const scheduledIso = buildScheduledAt(interviewDate, interviewTime);
      const jobPostingId = currentApplicant?.job_posting_id || currentApplicant?.jobPosting?.id || 1;

      const TYPE_TO_STAGE_KEY = {
        "Technical Assessment": "technical_assessment",
        "Initial Screening":    "initial_screening",
        "HR Interview":         "hr_interview",
        "Managerial Interview": "managerial_interview",
        "Final Interview":      "final",
      };
      const stageKey = TYPE_TO_STAGE_KEY[interviewType] || "initial_screening";

      let typeKey = "online";
      if (interviewMode === "ON-SITE") typeKey = "in_person";
      else if (interviewMode === "PHONE") typeKey = "phone";

      const payload = {
        applicant_id: Number(selectedApplicantId),
        job_posting_id: Number(jobPostingId),
        interview_stage: stageKey,
        interview_type: typeKey,
        scheduled_at: scheduledIso,
        location: interviewMode === "ON-SITE" ? "Head Office" : null,
        notes: notes.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_number: contactNumber.trim() || null,
        notify_applicant: notifyApplicant,
        notify_interviewer: notifyInterviewer,
      };

      const { data } = await interviewService.create(payload);
      setSent(STAGE_LABELS[stageKey] || "Interview");
      onSaved?.(data.interview);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Failed to schedule interview." });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-200 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition"
        >
          <FiX className="h-6 w-6" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-[#1e293b]">Schedule Interview</h2>
          <p className="text-xs text-slate-500 font-medium">
            Set the interview details for this applicant
          </p>
        </div>

        {/* Success Banner if sent */}
        {sent ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
              ✓
            </div>
            <div>
              <span className="inline-block mb-3 px-4 py-1 rounded-full text-xs font-bold tracking-wide bg-indigo-100 text-indigo-700">
                {sent}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Interview Scheduled!</h3>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              A <strong>{sent}</strong> invitation has been successfully sent to <strong>{applicantName}</strong>.
              {" "}The email includes the exact interview stage, schedule, and the video room link (if applicable).
            </p>
            <Button onClick={onClose} className="bg-[#3730a3] hover:bg-[#312e81] text-white font-bold px-8">
              Close & Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ── Top Applicant Summary Banner (Matching Image) ──────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-[#f5f3ff] border border-[#e2d9f7] p-4 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-white shadow-md">
                  <FiUser className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1e293b]">
                      {applicantName}
                    </h3>
                    <span className="rounded-full bg-[#ede9fe] px-3 py-0.5 text-[11px] font-extrabold text-[#6d28d9] capitalize">
                      {applicantStage}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {jobCategory}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  APPLICATION DATE
                </p>
                <p className="text-xs font-extrabold text-slate-800">
                  {appDateFormatted}
                </p>
              </div>
            </div>

            {/* Candidate Selector (if multiple) */}
            {applicants.length > 1 && !prefillApplicantId && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Switch Candidate
                </label>
                <select
                  value={selectedApplicantId}
                  onChange={(e) => setSelectedApplicantId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} ({a.application_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ── 2 Columns Form Fields ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ── Left Column ────────────────────────────────────────── */}
              <div className="space-y-4">
                
                {/* Interview Type */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Interview Type
                  </label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Interview Date & Interview Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Interview Date
                    </label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Interview Time
                    </label>
                    <select
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time Zone */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Time Zone
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                {/* Interview Duration */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Interview Duration
                  </label>
                  <select
                    value={interviewDuration}
                    onChange={(e) => setInterviewDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  >
                    {DURATION_OPTIONS.map((dur) => (
                      <option key={dur.value} value={dur.value}>{dur.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* ── Right Column ───────────────────────────────────────── */}
              <div className="space-y-4">
                
                {/* Interview Mode Pills */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Interview Mode
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                    {["VIRTUAL", "ON-SITE", "PHONE"].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setInterviewMode(mode)}
                        className={`flex-1 rounded-lg py-2 text-xs font-extrabold transition-all ${
                          interviewMode === mode
                            ? "bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5] shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interviewer(s) Tag Input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Interviewer(s)
                  </label>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 min-h-[44px]">
                    {interviewers.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeInterviewerTag(name)}
                          className="text-blue-400 hover:text-blue-700 text-xs font-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {showAddInterviewer ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Name…"
                          value={newInterviewer}
                          onChange={(e) => setNewInterviewer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addInterviewerTag();
                            }
                          }}
                          className="w-24 rounded px-2 py-0.5 text-xs border border-slate-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={addInterviewerTag}
                          className="text-xs font-bold text-blue-600"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddInterviewer(true)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 px-2 py-1"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact Email & Contact Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* ── Full Width Field: Notes ────────────────────────────────── */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Notes or Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Add preparation notes, dress code, or specific topics to cover…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
              />
            </div>

            {/* ── Bottom Section: Summary Alert + Checkboxes + Action Buttons ── */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              
              {/* Summary Box (Matching Image) */}
              <div className="flex items-start gap-3 rounded-2xl bg-[#f4f3ff] border border-[#e0e7ff] p-3.5 text-xs text-[#3730a3]">
                <FiInfo className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                <p className="leading-relaxed">
                  <strong>Summary:</strong> {interviewMode} Interview with <strong>{applicantName}</strong> on <strong className="text-orange-600">{interviewDate || "Oct 24"} @ {interviewTime}</strong>. Video link included in invites.
                </p>
              </div>

              {/* Action Controls Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Left Checkboxes */}
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyApplicant}
                      onChange={(e) => setNotifyApplicant(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Send notification to applicant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyInterviewer}
                      onChange={(e) => setNotifyInterviewer(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Send calendar invite to interviewer</span>
                  </label>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-extrabold text-slate-500 hover:text-slate-800 px-3 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-[#ede9fe] hover:bg-[#ddd6fe] px-4 py-2.5 text-xs font-extrabold text-[#5b21b6] transition"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-[#3730a3] hover:bg-[#312e81] px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition"
                  >
                    {loading ? "Scheduling…" : "Schedule Interview"}
                  </button>
                </div>

              </div>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}
