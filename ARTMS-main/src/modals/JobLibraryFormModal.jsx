import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Hash, DollarSign, Briefcase, List, FileCheck, Plus, Trash2, GraduationCap, X, FolderPlus, Edit, AlertTriangle, XCircle, Upload, Sparkles, Loader2, CheckCircle2, Download, FileSpreadsheet, ChevronDown, ChevronUp, Copy, Check, HelpCircle } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import ActionLoadingModal from "../components/ui/ActionLoadingModal";
import api from "../services/api";
import { calculateSalaryBreakdown } from "../utils/salaryUtils";
import { useToast } from "../context/ToastContext";

/**
 * JobLibraryFormModal - Create or Edit Job Library Entry
 */
export default function JobLibraryFormModal({
  open,
  mode,
  data,
  initialData,
  form: propForm,
  setForm: propSetForm,
  onClose,
  onSave,
  saving = false,
}) {
  const toast = useToast();
  const targetData = data || initialData;
  const isRejected = mode === "edit" && targetData?.approval_status === "rejected";
  const isRevised = mode === "edit" && targetData?.approval_status === "revised";
  const remarksText = targetData?.approval_remarks || targetData?.remarks;

  const [internalForm, setInternalForm] = useState({
    job_title: "",
    job_description: "",
    qualifications: [],
    responsibilities: [],
    job_category: "",
    employment_type: "full_time",
    salary_type: "exact",
    salary_min: "",
    salary_max: "",
    hr_remarks: "",
  });

  const form = propForm || internalForm;
  const setForm = propSetForm || setInternalForm;

  const qualBlocks = Array.isArray(form?.qualifications) ? form.qualifications : [];
  const respBlocks = Array.isArray(form?.responsibilities) ? form.responsibilities : [];

  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Block Modal state (for Qualifications & Responsibilities)
  const [blockModal, setBlockModal] = useState({
    open: false,
    field: "qualifications",
    editingId: null,
  });
  const [blockTitle, setBlockTitle] = useState("");
  const [blockDetails, setBlockDetails] = useState([]);

  // Auto Input state
  const [inputMode, setInputMode] = useState("manual"); // "manual" | "auto"
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState(null); // null | "success" | "error"
  const [parseMessage, setParseMessage] = useState("");
  const [parseMissingFields, setParseMissingFields] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState(false);
  const fileInputRef = useRef(null);

  const ACCEPTED_TYPES = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt"];

  const SAMPLE_DOC_TEXT = `JOB TITLE: Customer Service Representative
JOB CATEGORY: Operations
EMPLOYMENT TYPE: full_time
SALARY RANGE: 25000 - 35000

JOB DESCRIPTION:
We are looking for a dedicated Customer Service Representative to handle inquiries, resolve technical and account issues, and deliver exceptional support across multiple channels.

QUALIFICATIONS:
Education & Experience:
- High school diploma, GED, or Bachelor's degree
- 1+ years experience in customer service, call center, or client support

Key Skills:
- Exceptional verbal and written communication
- Experience with CRM platforms (Salesforce, Zendesk, etc.)
- Strong problem-solving and conflict resolution ability

RESPONSIBILITIES:
Core Duties:
- Answer incoming phone calls, emails, and live chat inquiries promptly
- Troubleshoot customer complaints and escalate complex issues when needed
- Maintain in-depth knowledge of company products and services

Documentation & Reporting:
- Log customer interactions and ticket statuses accurately in the database
- Provide weekly feedback to team leads on common user complaints`;

  const downloadCsvTemplate = () => {
    const csvContent = `"Job Title","Job Category","Employment Type","Salary Min","Salary Max","Job Description","Qualifications","Responsibilities"
"Customer Service Representative","Operations","full_time","25000","35000","We are looking for a dedicated Customer Service Representative to handle customer inquiries, resolve technical issues, and provide exceptional customer satisfaction.","[Education & Experience]
- High school diploma, GED, or Bachelor's degree
- 1+ years experience in customer support or call center
[Key Skills]
- Exceptional verbal and written communication
- Experience with CRM software (Salesforce, Zendesk)
- Problem-solving and emotional intelligence","[Core Duties]
- Handle incoming inquiries via phone, email, and chat
- Troubleshoot client issues and escalate when necessary
- Maintain up-to-date knowledge of company products
[Documentation]
- Log all tickets and interaction notes in CRM system"`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Job_Library_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template Downloaded", "Job_Library_Template.csv downloaded successfully.");
  };

  const downloadDocTemplate = () => {
    const blob = new Blob([SAMPLE_DOC_TEXT], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Job_Library_Template.txt");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template Downloaded", "Job_Library_Template.txt downloaded successfully.");
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_DOC_TEXT);
    setCopiedFormat(true);
    toast.success("Copied to Clipboard", "Sample template text copied to your clipboard.");
    setTimeout(() => setCopiedFormat(false), 2000);
  };

  const handleDocumentUpload = useCallback(async (file) => {
    if (!file) return;

    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      toast.error("Invalid File", `Please upload one of: ${ACCEPTED_TYPES.join(", ")}`);
      return;
    }

    setUploadedFileName(file.name);
    setIsParsing(true);
    setParseStatus(null);
    setParseMessage("");
    setParseMissingFields([]);

    try {
      const formPayload = new FormData();
      formPayload.append("document", file);

      const res = await api.post("/job-library/parse-document", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { success, data, message, missing_fields } = res.data || {};

      if (success && data && (data.job_title || data.job_description)) {
        // Auto-fill form fields
        setForm((prev) => ({
          ...prev,
          job_title: data.job_title || prev.job_title,
          job_description: data.job_description || prev.job_description,
          job_category: data.job_category || prev.job_category,
          employment_type: data.employment_type || prev.employment_type,
          salary_min: data.salary_min ?? prev.salary_min,
          salary_max: data.salary_max ?? prev.salary_max,
          salary_type: (data.salary_min && data.salary_max && data.salary_min !== data.salary_max) ? "range" : "exact",
          qualifications: Array.isArray(data.qualifications) && data.qualifications.length > 0 ? data.qualifications : prev.qualifications,
          responsibilities: Array.isArray(data.responsibilities) && data.responsibilities.length > 0 ? data.responsibilities : prev.responsibilities,
        }));

        setParseStatus("success");
        setParseMessage(message || "Document parsed successfully!");
        setParseMissingFields([]);
        toast.success("Auto-Fill Complete", "All fields have been populated from your document. Switching to Manual Input for review.");

        // Auto-switch to manual tab after a brief delay
        setTimeout(() => setInputMode("manual"), 1200);
      } else {
        setParseStatus("error");
        const msg = message || "The uploaded file does not contain recognized job description details.";
        setParseMessage(msg);
        setParseMissingFields(missing_fields || []);
        toast.warning("Incompatible Document", msg);
      }
    } catch (err) {
      console.error("Document parse error:", err);
      setParseStatus("error");
      const errorMsg = err.response?.data?.message || "The uploaded file could not be parsed as a Job Description.";
      const missing = err.response?.data?.missing_fields || [];
      setParseMessage(errorMsg);
      setParseMissingFields(missing);
      toast.error("Incompatible File Uploaded", errorMsg);
    } finally {
      setIsParsing(false);
    }
  }, [setForm, toast]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleDocumentUpload(file);
  }, [handleDocumentUpload]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target?.files?.[0];
    if (file) handleDocumentUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleDocumentUpload]);

  useEffect(() => {
    if (open) {
      fetchCategories();
      setShowCategoryModal(false);
      setNewCategory("");
      setInputMode("manual");
      setIsParsing(false);
      setParseStatus(null);
      setParseMessage("");
      setUploadedFileName("");
      const init = initialData || data || {};
      setInternalForm({
        id: init.id,
        job_title: init.job_title || "",
        job_description: init.job_description || "",
        qualifications: Array.isArray(init.qualifications) ? init.qualifications : [],
        responsibilities: Array.isArray(init.responsibilities) ? init.responsibilities : [],
        job_category: init.job_category || "",
        employment_type: init.employment_type || "full_time",
        salary_type: init.salary_type || "exact",
        salary_min: init.salary_min ?? "",
        salary_max: init.salary_max ?? "",
        hr_remarks: "",
      });
    }
  }, [open, initialData, data]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/job-categories');
      setCategories(res.data);
    } catch (e) {
      console.error('Failed to fetch job categories', e);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setSavingCategory(true);
    try {
      const res = await api.post('/job-categories', { name: newCategory.trim() });
      const updated = [...categories, res.data].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(updated);
      setForm({ ...form, job_category: res.data.name });
      setShowCategoryModal(false);
      setNewCategory("");
    } catch (e) {
      console.error('Failed to add category', e);
      toast.error("Category Error", e.response?.data?.message || 'Failed to add category.');
    } finally {
      setSavingCategory(false);
    }
  };

  // Block Modal Handlers
  const openAddBlockModal = (field) => {
    setBlockModal({ open: true, field, editingId: null });
    setBlockTitle("");
    setBlockDetails([{ id: Date.now(), value: "" }]);
  };

  const openEditBlockModal = (field, block) => {
    setBlockModal({ open: true, field, editingId: block.id });
    setBlockTitle(block.title || "");
    setBlockDetails(
      Array.isArray(block.details) && block.details.length > 0
        ? block.details.map((d) => ({ id: d.id || Date.now() + Math.random(), value: d.value || "" }))
        : [{ id: Date.now(), value: "" }]
    );
  };

  const removeBlock = (field, id) => {
    const current = Array.isArray(form[field]) ? form[field] : [];
    setForm({
      ...form,
      [field]: current.filter((b) => b.id !== id),
    });
  };

  const handleAddModalDetail = () => {
    setBlockDetails([
      ...blockDetails,
      { id: Date.now() + Math.random(), value: "" },
    ]);
  };

  const handleUpdateModalDetail = (id, value) => {
    setBlockDetails(
      blockDetails.map((d) => (d.id === id ? { ...d, value } : d))
    );
  };

  const handleRemoveModalDetail = (id) => {
    setBlockDetails(blockDetails.filter((d) => d.id !== id));
  };

  const handleSaveBlockModal = () => {
    if (!blockTitle.trim()) {
      toast.warning("Missing Title", "Please enter a title for this block before saving.");
      return;
    }

    const cleanDetails = blockDetails.filter((d) => d.value.trim() !== "");
    const currentBlocks = Array.isArray(form[blockModal.field]) ? form[blockModal.field] : [];

    let updatedBlocks;
    if (blockModal.editingId) {
      updatedBlocks = currentBlocks.map((b) =>
        b.id === blockModal.editingId
          ? { ...b, title: blockTitle.trim(), details: cleanDetails }
          : b
      );
    } else {
      updatedBlocks = [
        ...currentBlocks,
        { id: Date.now(), title: blockTitle.trim(), details: cleanDetails },
      ];
    }

    setForm({ ...form, [blockModal.field]: updatedBlocks });
    setBlockModal({ open: false, field: "qualifications", editingId: null });
    setBlockTitle("");
    setBlockDetails([]);
  };

  if (!open) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        className="max-w-4xl"
        title={mode === "create" ? "Add Job Entry" : (isRejected ? "Revise Rejected Job Entry" : "Edit Job Entry")}
        description={
          mode === "create"
            ? "New entries require COO approval before appearing in PRF dropdowns"
            : (isRejected
              ? `Review COO feedback below and resubmit JL-${String(data?.id ?? 0).padStart(3, "0")}`
              : `Editing JL-${String(data?.id ?? 0).padStart(3, "0")}`)
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant={isRejected || isRevised ? "primary" : "primary"} onClick={() => onSave(form)} disabled={saving} className={isRejected ? "bg-red-600 hover:bg-red-700 font-bold" : isRevised ? "bg-amber-600 hover:bg-amber-700 font-bold" : ""}>
              {saving
                ? "Saving..."
                : isRejected || isRevised
                  ? "Revise & Resubmit to COO"
                  : mode === "create"
                    ? "Submit for Approval"
                    : "Save Changes"}
            </Button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-6">
          {/* Input Mode Tabs (only in create mode) */}
          {mode === "create" && (
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-all duration-200 cursor-pointer ${
                  inputMode === "manual"
                    ? "bg-[#111A62] text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-[#111A62] hover:bg-slate-200/60 font-semibold"
                }`}
              >
                <Edit size={15} />
                Manual Input
              </button>
              <button
                type="button"
                onClick={() => setInputMode("auto")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-all duration-200 cursor-pointer ${
                  inputMode === "auto"
                    ? "bg-[#111A62] text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-[#111A62] hover:bg-slate-200/60 font-semibold"
                }`}
              >
                <Sparkles size={15} />
                Auto Input
              </button>
            </div>
          )}

          {/* Auto Input Mode */}
          {mode === "create" && inputMode === "auto" && (
            <div className="space-y-5">
              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isParsing && fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer ${
                  isParsing
                    ? "border-[#111A62]/40 bg-[#111A62]/5 pointer-events-none"
                    : isDragging
                      ? "border-[#111A62] bg-[#111A62]/10 scale-[1.01]"
                      : "border-slate-300 bg-slate-50/50 hover:border-[#111A62]/50 hover:bg-[#111A62]/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isParsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-[#111A62]/10 flex items-center justify-center">
                        <Loader2 size={28} className="text-[#111A62] animate-spin" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111A62]">Parsing Document...</p>
                      <p className="mt-1 text-xs text-slate-500">{uploadedFileName}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">AI is extracting job information from your document</p>
                    </div>
                  </div>
                ) : parseStatus === "success" ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 size={28} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">Auto-Fill Complete!</p>
                      <p className="mt-1 text-xs text-slate-500">{parseMessage}</p>
                      <p className="mt-1 text-[11px] text-slate-400">Switching to Manual Input for review...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-[#111A62]/8 flex items-center justify-center">
                      <Upload size={28} className="text-[#111A62]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        Drag & drop your document here
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        or <span className="text-[#111A62] font-semibold underline underline-offset-2">click to browse</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Supported Formats */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { ext: "PDF", color: "bg-red-50 text-red-600 border-red-100" },
                  { ext: "DOCX", color: "bg-blue-50 text-blue-600 border-blue-100" },
                  { ext: "DOC", color: "bg-blue-50 text-blue-600 border-blue-100" },
                  { ext: "XLSX", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                  { ext: "XLS", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                  { ext: "CSV", color: "bg-amber-50 text-amber-600 border-amber-100" },
                  { ext: "TXT", color: "bg-slate-50 text-slate-600 border-slate-200" },
                ].map(({ ext, color }) => (
                  <span
                    key={ext}
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold ${color}`}
                  >
                    {ext}
                  </span>
                ))}
              </div>

              {/* Error / Incompatible File Warning */}
              {parseStatus === "error" && (
                <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-red-50/50 p-4.5 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <span>Incompatible or Unrecognized Document</span>
                        </h4>
                        {uploadedFileName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 border border-amber-200 truncate max-w-[220px]">
                            {uploadedFileName}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-amber-800 leading-relaxed font-medium">
                        {parseMessage}
                      </p>

                      {parseMissingFields.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-amber-900">Missing Elements:</span>
                          {parseMissingFields.map((field) => (
                            <span key={field} className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                              ✕ {field.replace(/_/g, " ").toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Guidance */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-amber-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            setParseStatus(null);
                            setParseMessage("");
                            setParseMissingFields([]);
                            fileInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#111A62] bg-[#111A62] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#111A62]/90 cursor-pointer shadow-2xs"
                        >
                          <Upload size={13} />
                          <span>Upload Another File</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowFormatGuide(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <HelpCircle size={13} />
                          <span>View Expected Format</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInputMode("manual")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer ml-auto"
                        >
                          <Edit size={13} />
                          <span>Fill in Manually</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Ready-to-Use Templates Banner */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 p-4.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-indigo-100/70">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111A62] text-white">
                        <Download size={14} />
                      </div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#111A62]">
                        Download Standard Templates
                      </h4>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Download a pre-formatted template with all required fields, fill it in, and upload it here.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
                      title="Download CSV / Excel Template"
                    >
                      <FileSpreadsheet size={14} className="text-emerald-600" />
                      <span>Excel / CSV Template</span>
                      <Download size={12} className="text-emerald-600 opacity-75" />
                    </button>

                    <button
                      type="button"
                      onClick={downloadDocTemplate}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50/80 hover:bg-indigo-100/80 px-3 py-1.5 text-xs font-bold text-[#111A62] transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
                      title="Download Word / Text Document Template"
                    >
                      <FileText size={14} className="text-indigo-600" />
                      <span>Word / Text Template</span>
                      <Download size={12} className="text-indigo-600 opacity-75" />
                    </button>
                  </div>
                </div>

                {/* Format Guide Toggle */}
                <div className="pt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowFormatGuide(!showFormatGuide)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111A62] hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    <HelpCircle size={13} />
                    <span>{showFormatGuide ? "Hide" : "View"} Expected Format & Field Guide</span>
                    {showFormatGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {/* Expandable Format Guide */}
                  {showFormatGuide && (
                    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs transition-all duration-200">
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                          <span>📋 Expected Document / Spreadsheet Fields:</span>
                          <button
                            type="button"
                            onClick={handleCopySample}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#111A62] hover:underline cursor-pointer"
                          >
                            {copiedFormat ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            <span>{copiedFormat ? "Copied!" : "Copy Sample Text"}</span>
                          </button>
                        </h5>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                            <span className="font-bold text-slate-700 block">1. Job Title & Category</span>
                            <span className="text-slate-500">e.g. Customer Service Representative | Operations</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                            <span className="font-bold text-slate-700 block">2. Employment Type & Salary</span>
                            <span className="text-slate-500">full_time, part_time, etc. | ₱25,000 - ₱35,000</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                            <span className="font-bold text-slate-700 block">3. Job Description</span>
                            <span className="text-slate-500">A clear 2-4 sentence overview of the role and goals</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                            <span className="font-bold text-slate-700 block">4. Qualifications & Responsibilities</span>
                            <span className="text-slate-500">Grouped into category titles with bullet point items</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="font-bold text-slate-700 text-[11px] block mb-1.5">📝 Sample Text Layout Preview:</span>
                        <pre className="rounded-lg bg-slate-900 text-slate-100 p-3 text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre">
{SAMPLE_DOC_TEXT}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* How it works */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold text-blue-900">
                  ✨ How Auto Input Works
                </p>
                <ul className="mt-2 space-y-1 text-xs text-blue-700">
                  <li>• Download one of the templates above or use your own file</li>
                  <li>• Upload it in PDF, Word (DOCX/DOC), Excel (XLSX/XLS), CSV, or TXT format</li>
                  <li>• AI automatically extracts job title, description, salary, qualifications & responsibilities</li>
                  <li>• Review and fine-tune all auto-populated fields in Manual Input mode before submitting</li>
                </ul>
              </div>
            </div>
          )}

          {/* Manual Input Mode (original form content) */}
          {(inputMode === "manual" || mode !== "create") && (
          <>
          {/* COO Feedback Banner for Rejected Entries */}
          {isRejected && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-amber-50/60 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
                  <XCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    COO Rejection Remarks & Feedback
                  </h4>
                  <p className="mt-1 text-sm font-medium text-red-800 whitespace-pre-wrap">
                    {remarksText || "No specific feedback or remarks provided by the COO."}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    💡 Modify the qualifications, responsibilities, or details below to address the COO's feedback, then click "Revise & Resubmit to COO".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* COO Revision Feedback Banner */}
          {isRevised && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Action Required: COO Revision Feedback
                  </h4>
                  <p className="mt-1 text-sm font-medium text-amber-800 whitespace-pre-wrap">
                    {remarksText || "No specific revision details provided by the COO."}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    💡 Please apply the requested changes below, then explicitly state what you changed so the COO can review it quickly.
                  </p>
                </div>
              </div>
              <div className="border-t border-amber-200/50 pt-4">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-amber-900">
                  HR Revision Notes (What did you change?) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  className="w-full resize-none rounded-lg border border-amber-300/60 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200"
                  placeholder="e.g., Updated the salary range and added 2 years of experience required as requested..."
                  value={form.hr_remarks}
                  onChange={(e) => setForm({ ...form, hr_remarks: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-blue-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                Basic Information
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              {/* Job Title */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileCheck size={14} className="text-slate-400" />
                  Job Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  placeholder="e.g., Customer Service Representative"
                />
              </div>

              {/* Category & Employment Type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Hash size={14} className="text-slate-400" />
                    Job Category
                  </label>

                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <Select
                        value={form.job_category}
                        onChange={(e) => setForm({ ...form, job_category: e.target.value })}
                        options={[
                          { value: "", label: "Select a Category" },
                          ...categories.map(c => ({ value: c.name, label: c.name }))
                        ]}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCategoryModal(true)}
                      className="h-11 shrink-0 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 hover:border-[#111A62] active:bg-[#111A62]/20 transition-all duration-200 px-3.5 cursor-pointer shadow-2xs font-semibold"
                      title="Add New Category"
                    >
                      <Plus size={16} />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Briefcase size={14} className="text-slate-400" />
                    Employment Type
                  </label>
                  <Select
                    value={form.employment_type}
                    onChange={(e) =>
                      setForm({ ...form, employment_type: e.target.value })
                    }
                    options={[
                      { value: "full_time", label: "Full-time" },
                      { value: "part_time", label: "Part-time" },
                      { value: "contractual", label: "Contractual" },
                      { value: "project_based", label: "Project-based" },
                      { value: "probationary", label: "Probationary" },
                      { value: "ojt", label: "OJT / Internship" },
                    ]}
                  />
                </div>
              </div>

              {/* Salary Details */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <DollarSign size={14} className="text-slate-400" />
                    Salary Type
                  </label>
                  <Select
                    value={form.salary_type || "exact"}
                    onChange={(e) => {
                      const type = e.target.value;
                      setForm({
                        ...form,
                        salary_type: type,
                        ...(type === "exact" ? { salary_max: form.salary_min } : {})
                      });
                    }}
                    options={[
                      { value: "exact", label: "Exact Monthly Salary" },
                      { value: "range", label: "Salary Range (Min - Max)" }
                    ]}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <DollarSign size={14} className="text-slate-400" />
                      {form.salary_type === "exact" ? "Monthly Salary (₱)" : "Monthly Salary Min (₱)"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.salary_min}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          salary_min: val,
                          ...(form.salary_type === "exact" ? { salary_max: val } : {})
                        });
                      }}
                      placeholder="e.g., 20000"
                    />
                  </div>

                  {form.salary_type !== "exact" && (
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <DollarSign size={14} className="text-slate-400" />
                        Monthly Salary Max (₱)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={form.salary_max}
                        onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                        placeholder="e.g., 35000"
                      />
                    </div>
                  )}
                </div>

                {/* Salary Breakdown Preview */}
                {(() => {
                  const bd = calculateSalaryBreakdown(form.salary_min, form.salary_max, form.salary_type);
                  if (!bd) return null;
                  return (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs">
                      <p className="font-bold text-[#111A62] mb-2 flex items-center gap-1.5">
                        <DollarSign size={14} className="text-blue-600" />
                        Estimated Compensation Breakdown
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-white p-2 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Weekly Rate</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bd.formatted.weekly}</span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Daily Rate</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bd.formatted.daily}</span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Hourly Rate</span>
                          <span className="font-bold text-[#111A62] text-xs mt-0.5 block">{bd.formatted.hourly}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 text-center italic">
                        Calculated based on standard PH labor rates (261 working days/yr, 8 hrs/day).
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <List size={16} className="text-blue-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                Job Details
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              {/* Job Description */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText size={14} className="text-slate-400" />
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Brief overview of the role and its purpose..."
                  value={form.job_description}
                  onChange={(e) =>
                    setForm({ ...form, job_description: e.target.value })
                  }
                />
              </div>

              {/* Qualifications & Responsibilities Grid */}
              <div className="grid gap-6 sm:grid-cols-2 pt-2">
                {/* Qualifications */}
                <div className="flex flex-col h-full">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <GraduationCap size={16} className="text-slate-400" />
                      Qualifications <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openAddBlockModal("qualifications")}
                      className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
                    >
                      <Plus size={14} /> Add Block
                    </Button>
                  </div>

                  {qualBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                      <p className="text-xs text-slate-500 italic">No qualifications added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qualBlocks.map((block) => (
                        <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditBlockModal("qualifications", block)}
                                className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Block"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBlock("qualifications", block.id)}
                                className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {block.details && block.details.length > 0 && (
                            <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                              {block.details.map((detail, idx) => (
                                <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">
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
                <div className="flex flex-col h-full sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <List size={16} className="text-slate-400" />
                      Responsibilities <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openAddBlockModal("responsibilities")}
                      className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
                    >
                      <Plus size={14} /> Add Block
                    </Button>
                  </div>

                  {respBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                      <p className="text-xs text-slate-500 italic">No responsibilities added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {respBlocks.map((block) => (
                        <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditBlockModal("responsibilities", block)}
                                className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Block"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBlock("responsibilities", block.id)}
                                className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {block.details && block.details.length > 0 && (
                            <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                              {block.details.map((detail, idx) => (
                                <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">
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
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-900">
              💡 Job Library Information
            </p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>• All new entries require COO approval before use</li>
              <li>• Approved entries appear in PRF position dropdowns</li>
              <li>• Templates can be reused across multiple job postings</li>
              <li>• Qualifications and responsibilities auto-fill PRF forms</li>
            </ul>
          </div>
          </>
          )}
        </form>
      </Modal>

      {/* Qualification / Responsibility Block Sub-Modal */}
      <Modal
        open={blockModal.open}
        containerClassName="z-[110]"
        onClose={() => setBlockModal({ open: false, field: "qualifications", editingId: null })}
        className="max-w-xl"
        title={
          <div className="flex items-center gap-2">
            {blockModal.field === "qualifications" ? (
              <GraduationCap className="h-5 w-5 text-blue-600" />
            ) : (
              <List className="h-5 w-5 text-blue-600" />
            )}
            <span>
              {blockModal.editingId ? "Edit" : "Add"}{" "}
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
              onClick={() => setBlockModal({ open: false, field: "qualifications", editingId: null })}
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

      {/* Add Job Category Sub-Modal */}
      <Modal
        open={showCategoryModal}
        containerClassName="z-[110]"
        onClose={() => {
          if (!savingCategory) {
            setShowCategoryModal(false);
            setNewCategory("");
          }
        }}
        className="max-w-md"
        title={
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            <span>Add Job Category</span>
          </div>
        }
        description="Create a new standardized job category to classify positions across the system."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategory("");
              }}
              disabled={savingCategory}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddCategory}
              disabled={savingCategory || !newCategory.trim()}
              className="gap-1.5"
            >
              <Plus size={16} />
              {savingCategory ? "Adding..." : "Add Category"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Hash size={14} className="text-slate-400" />
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., Operations, Finance, IT"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newCategory.trim() && !savingCategory) {
                    handleAddCategory();
                  }
                }
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Full-screen blocking loading overlay for saving (Create/Edit) */}
      <ActionLoadingModal
        open={saving}
        type={mode === "create" ? "create" : "edit"}
        title={mode === "create" ? "Creating Job Entry..." : "Updating Job Entry..."}
        message={
          mode === "create"
            ? "Submitting new job entry to COO for approval. Please wait..."
            : "Updating job entry details and resubmitting to COO. Please wait..."
        }
      />

      {/* Full-screen blocking loading overlay for AI document parsing */}
      <ActionLoadingModal
        open={isParsing}
        type="upload"
        title="Analyzing Document..."
        message={`AI is parsing ${uploadedFileName || "your file"} and mapping fields. Please wait...`}
      />
    </>
  );
}
