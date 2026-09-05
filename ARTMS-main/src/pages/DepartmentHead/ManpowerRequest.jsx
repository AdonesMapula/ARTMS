import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiInfo,
  FiBookOpen,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiArrowRight,
  FiAward,
  FiTarget,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import manpowerService from "../../services/manpowerService";
import { calculateSalaryBreakdown } from "../../utils/salaryUtils";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import SearchBar from "../../components/ui/SearchBar";
import DatePicker from "../../components/ui/DatePicker";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { GraduationCap, List, Plus, Trash2, Edit, FileCheck, X } from "lucide-react";

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "probationary", label: "Probationary" },
  { value: "project_based", label: "Project-Based" },
  { value: "seasonal", label: "Seasonal" },
  { value: "ojt", label: "OJT" },
];

const PLANTILLA_OPTIONS = [
  { value: "replacement", label: "Replacement" },
  { value: "additional", label: "Additional Manpower" },
  { value: "new_position", label: "Newly Created Position" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

// ── shared styles ────────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300";
const hintClass = "text-[11px] font-normal text-slate-400 dark:text-slate-500";

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative rounded-md border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer text-left flex items-center justify-between",
        active
          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
          : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60",
      ].join(" ")}
    >
      <span>{children}</span>
      {active && (
        <FiCheckCircle size={13} className="text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
      )}
    </button>
  );
}

function SectionCard({ eyebrow, title, description, children, badge, icon }) {
  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      {(eyebrow || title) && (
        <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {eyebrow && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {eyebrow}
                  </p>
                )}
                {badge}
              </div>
              {title && (
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
              )}
            </div>
          </div>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// Function parseQualifications removed as Job Library now provides structured arrays

export default function ManpowerRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitPayload, setConfirmSubmitPayload] = useState(null);

  const [jobLibrary, setJobLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  useEffect(() => {
    api
      .get("/job-library/approved")
      .then((res) => setJobLibrary(res.data.data || []))
      .catch(() => setJobLibrary([]))
      .finally(() => setLibraryLoading(false));
  }, []);

  const initialForm = {
    job_library_id: "",
    position_needed: "",
    employment_status: "",
    needed_by: "",
    plantilla_type: "",
    replacement_for: "",
    qualifications: [],
    responsibilities: [],
    headcount: 1,
    urgency: "medium",
    high_fit_min: 75,
    medium_fit_min: 50,
  };

  const [form, setForm] = useState(initialForm);
  const [positionSearchText, setPositionSearchText] = useState("");
  // Track which Step 3 fields were auto-filled so we can show a badge
  const [autoFilled, setAutoFilled] = useState(false);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // ── When a job library entry is chosen, auto-populate Step 3 & 4 ──────────
  const handleJobLibrarySelect = (jobId) => {
    const selected = jobLibrary.find((j) => String(j.id) === String(jobId));
    if (!selected) {
      // Cleared — reset
      setForm((prev) => ({
        ...prev,
        job_library_id: "",
        position_needed: "",
        qualifications: [],
        responsibilities: [],
      }));
      setAutoFilled(false);
      setPositionSearchText("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      job_library_id: selected.id,
      position_needed: selected.job_title,
      // Step 3 auto-populate from nested arrays
      qualifications: selected.qualifications || [],
      responsibilities: selected.responsibilities || [],
    }));
    setAutoFilled(true);
    setPositionSearchText(`${selected.job_title}${selected.job_category ? ` — ${selected.job_category}` : ""}`);
  };

  // ── Block Modal State & Handlers (Qualifications & Responsibilities Step 3) ──
  const [blockModal, setBlockModal] = useState({
    open: false,
    field: "qualifications",
    editingIdx: null,
  });
  const [blockTitle, setBlockTitle] = useState("");
  const [blockDetails, setBlockDetails] = useState([]);

  const openAddBlockModal = (field) => {
    setBlockModal({ open: true, field, editingIdx: null });
    setBlockTitle("");
    setBlockDetails([{ id: Date.now(), value: "" }]);
  };

  const openEditBlockModal = (field, block, idx) => {
    setBlockModal({ open: true, field, editingIdx: idx });
    setBlockTitle(block.title || "");
    setBlockDetails(
      Array.isArray(block.details) && block.details.length > 0
        ? block.details.map((d) => ({
          id: d.id || Date.now() + Math.random(),
          value: typeof d === "string" ? d : (d.value ?? ""),
        }))
        : [{ id: Date.now(), value: "" }]
    );
  };

  const handleRemoveBlock = (field, idx) => {
    const list = Array.from(form[field] || []);
    list.splice(idx, 1);
    setForm((prev) => ({ ...prev, [field]: list }));
  };

  const handleAddModalDetail = () => {
    setBlockDetails((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), value: "" },
    ]);
  };

  const handleUpdateModalDetail = (id, value) => {
    setBlockDetails((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value } : d))
    );
  };

  const handleRemoveModalDetail = (id) => {
    setBlockDetails((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveBlockModal = () => {
    if (!blockTitle.trim()) {
      alert("Please enter a category / block title.");
      return;
    }

    const cleanDetails = blockDetails.filter((d) => d.value.trim() !== "");
    const currentBlocks = Array.from(form[blockModal.field] || []);

    if (blockModal.editingIdx !== null) {
      currentBlocks[blockModal.editingIdx] = {
        ...currentBlocks[blockModal.editingIdx],
        title: blockTitle.trim(),
        details: cleanDetails,
      };
    } else {
      currentBlocks.push({
        id: Date.now(),
        title: blockTitle.trim(),
        details: cleanDetails,
      });
    }

    setForm((prev) => ({ ...prev, [blockModal.field]: currentBlocks }));
    setBlockModal({ open: false, field: "qualifications", editingIdx: null });
    setBlockTitle("");
    setBlockDetails([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.position_needed) {
      toast.warning("Missing Field", "Please enter a Position Title.");
      return;
    }
    if (!form.job_library_id) {
      toast.warning("Missing Field", "Please select a position from the Job Library.");
      return;
    }
    if (!form.employment_status) {
      toast.warning("Missing Field", "Please select an Employment Status.");
      return;
    }
    if (!form.plantilla_type) {
      toast.warning("Missing Field", "Please select a Plantilla Requirement.");
      return;
    }

    const justification = [
      `Employment Status: ${form.employment_status.replace(/_/g, " ")}`,
      `Plantilla Type: ${form.plantilla_type.replace(/_/g, " ")}`,
      form.replacement_for && `Replacement For: ${form.replacement_for}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const payload = {
      job_library_id: form.job_library_id,
      position_needed: form.position_needed,
      headcount: Number(form.headcount) || 1,
      justification,
      employment_status: form.employment_status,
      plantilla_type: form.plantilla_type,
      replacement_for: form.replacement_for || null,
      qualifications: form.qualifications,
      responsibilities: form.responsibilities,
      needed_by: form.needed_by || null,
      urgency: form.urgency,
      fit_threshold_high: Number(form.high_fit_min) || 75,
      fit_threshold_medium: Number(form.medium_fit_min) || 50,
    };

    setConfirmSubmitPayload(payload);
  };

  const handleDoSubmit = async () => {
    if (!confirmSubmitPayload) return;
    const payload = confirmSubmitPayload;
    setConfirmSubmitPayload(null);

    try {
      setSubmitting(true);
      await manpowerService.create(payload);
      setForm(initialForm);
      setAutoFilled(false);
      setPositionSearchText("");
      toast.success(
        "Request Submitted",
        "Your Personnel Requisition Form has been submitted for HR review. You will be notified once it is processed.",
        { duration: 6000 }
      );
      navigate("/department-head/request-history");
    } catch (err) {
      toast.error(
        "Submission Failed",
        err?.response?.data?.message ?? "Failed to submit request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Fit threshold derived widths ────────────────────────────────────────
  const medium = Math.min(Math.max(Number(form.medium_fit_min) || 0, 0), 100);
  const high = Math.min(Math.max(Number(form.high_fit_min) || 0, 0), 100);
  const lowWidth = Math.min(medium, high);
  const midWidth = Math.max(high - lowWidth, 0);
  const highWidth = Math.max(100 - lowWidth - midWidth, 0);

  // ── Selected job library entry for the preview card ────────────────────
  const selectedJob = jobLibrary.find((j) => String(j.id) === String(form.job_library_id));

  return (
    <div className="space-y-5 pb-8">
      {/* Modern Page Header */}
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FiFileText className="text-amber-500" size={12} /> Manpower Requisitions
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Personnel Requisition Form
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select an approved position from the Job Library and configure requirements for review.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Step 1: Position & Schedule ──────────────────────────────────── */}
        <SectionCard
          eyebrow="Step 1"
          title="Position & Schedule"
          icon={<FiBriefcase size={14} />}
        >
          {/* 3-Column grid: Position Needed | Date Needed | Number of Headcount */}
          <div className="grid gap-4 sm:grid-cols-3">

            {/* Position Needed */}
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-1.5">
                  <FiBookOpen size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Position Needed</span>
                  <span className="text-rose-500">*</span>
                  <span className={hintClass}> — from Job Library</span>
                </div>
              </label>
              {libraryLoading ? (
                <div className={`${inputClass} flex items-center gap-2 text-slate-400`}>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  Loading positions…
                </div>
              ) : jobLibrary.length === 0 ? (
                <div className="flex items-start gap-2.5 rounded-md border border-amber-200/80 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                  <FiBookOpen className="text-amber-600 shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="font-semibold">No approved positions available</p>
                    <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                      An HR Admin must add entries to the Job Library and receive COO approval first.
                    </p>
                  </div>
                </div>
              ) : (
                <SearchBar
                  value={positionSearchText}
                  onChange={(val) => {
                    setPositionSearchText(val);
                    if (!val) handleJobLibrarySelect("");
                  }}
                  onSelectSuggestion={(item) => {
                    if (item.id === "all") handleJobLibrarySelect("");
                    else handleJobLibrarySelect(item.id);
                  }}
                  suggestions={jobLibrary.map((j) => ({
                    id: String(j.id),
                    label: `${j.job_title}${j.job_category ? ` — ${j.job_category}` : ""}`,
                  }))}
                  placeholder="Search position from library..."
                  className="h-[38px] text-xs"
                />
              )}
            </div>

            {/* Date Needed */}
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-1.5">
                  <FiCalendar size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Date Needed</span>
                </div>
              </label>
              <DatePicker
                value={form.needed_by}
                onChange={(val) => set("needed_by", val)}
                placeholder="Pick date…"
                disablePast
              />
            </div>

            {/* Number of Headcount */}
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-1.5">
                  <FiUsers size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Number of Headcount</span>
                </div>
              </label>
              <input
                type="number"
                min="1"
                value={form.headcount}
                onChange={(e) => set("headcount", e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

          </div>

          {/* Selected Job Preview Card */}
          {selectedJob && (
            <div className="mt-3.5 rounded-md border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-3.5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <FiCheckCircle size={13} className="text-blue-600 dark:text-blue-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Selected Position Preview
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedJob.job_title}</h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {selectedJob.job_category && (
                      <span className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-2 py-0.5 text-[11px] font-medium">
                        <FiTarget size={11} />
                        {selectedJob.job_category}
                      </span>
                    )}
                    {selectedJob.employment_type && (
                      <span className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-2 py-0.5 text-[11px] font-medium">
                        <FiBriefcase size={11} />
                        {selectedJob.employment_type?.replace(/_/g, " ")}
                      </span>
                    )}
                    {(() => {
                      const bd = calculateSalaryBreakdown(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_type);
                      if (!bd) return null;
                      return (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/60 px-2 py-0.5 font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                          <FiAward size={11} />
                          {bd.formatted.monthly} / mo
                        </span>
                      );
                    })()}
                  </div>
                  {selectedJob.job_description && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {selectedJob.job_description}
                    </p>
                  )}
                </div>

                {(() => {
                  const bd = calculateSalaryBreakdown(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_type);
                  if (!bd) return null;
                  return (
                    <div className="grid grid-cols-3 gap-1.5 text-center self-start">
                      <div className="rounded-md bg-white dark:bg-slate-900 p-2 border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Weekly</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">{bd.formatted.weekly}</span>
                      </div>
                      <div className="rounded-md bg-white dark:bg-slate-900 p-2 border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Daily</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">{bd.formatted.daily}</span>
                      </div>
                      <div className="rounded-md bg-white dark:bg-slate-900 p-2 border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Hourly</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5 block">{bd.formatted.hourly}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className={labelClass}>
              <div className="flex items-center gap-1.5 mb-2">
                <FiBriefcase size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Employment Status</span>
                <span className={hintClass}>(select one)</span>
              </div>
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={form.employment_status === opt.value}
                  onClick={() =>
                    set("employment_status", form.employment_status === opt.value ? "" : opt.value)
                  }
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Step 2: Plantilla Requirement ───────────────────────────────── */}
        <SectionCard
          eyebrow="Step 2"
          title="Plantilla Requirement"
          icon={<FiFileText size={14} />}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {PLANTILLA_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                active={form.plantilla_type === opt.value}
                onClick={() =>
                  set("plantilla_type", form.plantilla_type === opt.value ? "" : opt.value)
                }
              >
                {opt.label}
              </Pill>
            ))}
          </div>

          {form.plantilla_type === "replacement" && (
            <div className="mt-3.5 rounded-md border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-3.5">
              <label className={labelClass}>
                <div className="flex items-center gap-1.5">
                  <FiUsers size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Replacement For</span>
                </div>
              </label>
              <input
                type="text"
                value={form.replacement_for}
                onChange={(e) => set("replacement_for", e.target.value)}
                className={inputClass}
                placeholder="Name of employee being replaced"
              />
            </div>
          )}
        </SectionCard>

        {/* ── Step 3: Personnel Requirement Details ───────────────────────── */}
        <SectionCard
          eyebrow="Step 3"
          title="Personnel Requirement Details"
          icon={<FiAward size={14} />}
          badge={
            autoFilled && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                <FiCheckCircle size={10} />
                Job Library Linked
              </span>
            )
          }
          description={
            autoFilled
              ? "Fields pre-filled from the selected Job Library entry. You may adjust them for this specific requisition."
              : "Specify detailed qualification requirements and job responsibilities."
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Qualifications */}
            <div className="flex flex-col h-full rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <GraduationCap size={14} className="text-blue-600 dark:text-blue-400" />
                  Qualifications
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openAddBlockModal("qualifications")}
                  className="h-7 text-[11px] gap-1 px-2 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <Plus size={12} /> Add Block
                </Button>
              </div>

              {(!form.qualifications || form.qualifications.length === 0) ? (
                <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-center">
                  <p className="text-[11px] text-slate-400 italic">No qualifications added yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(form.qualifications || []).map((block, idx) => (
                    <div key={block.id || idx} className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBlockModal("qualifications", block, idx)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Block"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock("qualifications", idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete Block"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {block.details && block.details.length > 0 && (
                        <ul className="mt-1.5 pl-3.5 list-disc space-y-0.5 marker:text-slate-300 dark:marker:text-slate-600">
                          {block.details.map((detail, dIdx) => (
                            <li key={detail.id || dIdx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              {detail.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Responsibilities */}
            <div className="flex flex-col h-full rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <List size={14} className="text-blue-600 dark:text-blue-400" />
                  Responsibilities
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openAddBlockModal("responsibilities")}
                  className="h-7 text-[11px] gap-1 px-2 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <Plus size={12} /> Add Block
                </Button>
              </div>

              {(!form.responsibilities || form.responsibilities.length === 0) ? (
                <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-center">
                  <p className="text-[11px] text-slate-400 italic">No responsibilities added yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(form.responsibilities || []).map((block, idx) => (
                    <div key={block.id || idx} className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBlockModal("responsibilities", block, idx)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Block"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock("responsibilities", idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete Block"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {block.details && block.details.length > 0 && (
                        <ul className="mt-1.5 pl-3.5 list-disc space-y-0.5 marker:text-slate-300 dark:marker:text-slate-600">
                          {block.details.map((detail, dIdx) => (
                            <li key={detail.id || dIdx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              {detail.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Step 4: Priority ─────────────────────────────────────────────── */}
        <SectionCard
          eyebrow="Step 4"
          title="Priority Level"
          icon={<FiClock size={14} />}
          description="Set the requisition priority and hiring urgency."
        >
          <div className="grid gap-2 sm:grid-cols-4">
            {PRIORITY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                active={form.urgency === opt.value}
                onClick={() => set("urgency", opt.value)}
              >
                {opt.label}
              </Pill>
            ))}
          </div>
        </SectionCard>

        {/* ── Fit Threshold Configuration ─────────────────────────────────── */}
        <SectionCard
          eyebrow="AI Configuration"
          title="Applicant Match Thresholds"
          icon={<FiTarget size={14} />}
          description="Define score tiers for automated CV and evaluation fit classifications."
        >
          {/* Progress bar with labels */}
          <div className="relative">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="bg-rose-500 transition-all duration-300"
                style={{ width: `${lowWidth}%` }}
              />
              <div
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${midWidth}%` }}
              />
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${highWidth}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-mono">
              <span className="text-rose-600 dark:text-rose-400">
                LOW (0–{Math.max(medium - 1, 0)}%)
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                MEDIUM ({medium}–{Math.max(high - 1, medium)}%)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                HIGH ({high}–100%)
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3">
              <label className={labelClass}>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white text-[10px] font-bold">
                    H
                  </span>
                  <span>High Fit Threshold</span>
                </div>
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.high_fit_min}
                  onChange={(e) => set("high_fit_min", e.target.value)}
                  className={`${inputClass} font-mono font-bold text-emerald-600 dark:text-emerald-400`}
                />
                <span className="text-xs font-mono font-bold text-slate-500">%</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Minimum score for High Fit tier</p>
            </div>

            <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3">
              <label className={labelClass}>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500 text-white text-[10px] font-bold">
                    M
                  </span>
                  <span>Medium Fit Threshold</span>
                </div>
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.medium_fit_min}
                  onChange={(e) => set("medium_fit_min", e.target.value)}
                  className={`${inputClass} font-mono font-bold text-amber-600 dark:text-amber-400`}
                />
                <span className="text-xs font-mono font-bold text-slate-500">%</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Minimum score for Medium Fit tier</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-2.5 text-xs text-blue-800 dark:text-blue-300">
            <FiInfo size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-[11px] leading-relaxed">
              Applicants below the Medium threshold will be marked <span className="font-semibold text-rose-600">Low Fit</span>.
            </p>
          </div>
        </SectionCard>

        {/* ── Requested by ─────────────────────────────────────────────────── */}
        <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
              <FiUsers size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requisition Owner</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name ?? "Current User"}</p>
              <p className="text-[10px] font-mono text-slate-500 capitalize">{user?.role?.replace(/_/g, " ") ?? ""}</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-blue-200/70 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/40 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            <FiCheckCircle size={12} /> Auto-routed to COO
          </span>
        </div>

        {/* ── Submit row ───────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/department-head/request-history")}
            className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting PRF…
              </>
            ) : (
              <>
                <FiCheckCircle size={13} />
                Submit Requisition
                <FiArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Confirmation Dialog ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmSubmitPayload}
        title="Submit Manpower Request?"
        description={`Are you sure you want to submit a request for ${confirmSubmitPayload?.headcount || 1} headcount of "${confirmSubmitPayload?.position_needed}"?`}
        confirmLabel="Yes, Submit Request"
        cancelLabel="Cancel"
        tone="primary"
        onConfirm={handleDoSubmit}
        onClose={() => setConfirmSubmitPayload(null)}
      />

      {/* Qualification / Responsibility Block Sub-Modal */}
      <Modal
        open={blockModal.open}
        containerClassName="z-[110]"
        onClose={() => setBlockModal({ open: false, field: "qualifications", editingIdx: null })}
        className="max-w-xl"
        title={
          <div className="flex items-center gap-2">
            {blockModal.field === "qualifications" ? (
              <GraduationCap className="h-5 w-5 text-blue-600" />
            ) : (
              <List className="h-5 w-5 text-blue-600" />
            )}
            <span>
              {blockModal.editingIdx !== null ? "Edit" : "Add"}{" "}
              {blockModal.field === "qualifications" ? "Qualification Block" : "Responsibility Block"}
            </span>
          </div>
        }
        description={
          blockModal.field === "qualifications"
            ? "Group qualifications into categories (e.g. Educational Background, Skills) with bullet items."
            : "Group responsibilities into categories (e.g. Core Duties, Reporting) with bullet items."
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockModal({ open: false, field: "qualifications", editingIdx: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveBlockModal}
              disabled={!blockTitle.trim()}
              className="gap-1.5"
            >
              <FileCheck size={16} />
              <span>Save Block</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileCheck size={14} className="text-slate-400" />
              Category / Block Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder={
                blockModal.field === "qualifications"
                  ? "e.g., Educational Background, Technical Skills"
                  : "e.g., Core Duties, Daily Operations"
              }
              autoFocus
            />
          </div>

          {/* Details Bullet Items */}
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <List size={14} className="text-slate-400" />
                <span>Specific Bullet Items</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddModalDetail}
                className="h-7 gap-1 text-xs border-[#111A62] text-[#111A62] hover:bg-[#111A62]/10"
              >
                <Plus size={12} /> Add Item
              </Button>
            </label>

            {blockDetails.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No detail items added yet. Click &quot;Add Item&quot; to add bullet points.</p>
            ) : (
              <div className="space-y-2.5">
                {blockDetails.map((detail, index) => (
                  <div key={detail.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4 text-center shrink-0">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={
                        blockModal.field === "qualifications"
                          ? "e.g., Bachelor's Degree in Computer Science"
                          : "e.g., Manage customer inquiries and process support tickets"
                      }
                      value={detail.value}
                      onChange={(e) => handleUpdateModalDetail(detail.id, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveModalDetail(detail.id)}
                      className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10 px-2.5 cursor-pointer"
                      title="Remove Item"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
