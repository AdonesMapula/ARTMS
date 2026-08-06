import { useState, useEffect } from "react";
import {
  FiUser, FiFileText, FiEdit3, FiClock, FiUploadCloud,
  FiDownload, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiPhone, FiMail, FiMapPin, FiDollarSign, FiBriefcase,
  FiCalendar, FiShield, FiX, FiCheck, FiLoader, FiUserCheck, FiUserX, FiArrowLeft
} from "react-icons/fi";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import employeeService from "../../services/employeeService";

const DOC_TYPE_LABELS = {
  birth_cert: "Birth Certificate",
  sss_card: "SSS Number / Card / E-1 Form",
  tin: "Tax Identification Number (TIN)",
  resume: "Updated Resume / CV",
  nbi_clearance: "NBI Clearance",
  medical_cert: "Medical Clearance / Fit to Work",
  philhealth: "PhilHealth MDR / ID",
  pagibig: "Pag-IBIG MID / Member Record",
  diploma: "Diploma / Transcript of Records",
  photo: "2x2 Professional ID Photo",
};

const STATUS_BADGES = {
  active: { tone: "success", label: "Active" },
  on_leave: { tone: "warning", label: "On Leave" },
  resigned: { tone: "danger", label: "Resigned" },
  terminated: { tone: "danger", label: "Terminated" },
};

export default function Employee201Panel({ employeeId, onClose, onUpdated, departments = [] }) {
  const [activeTab, setActiveTab] = useState("profile"); // profile, documents, edit, history
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "", email: "", department_id: "", position: "",
    salary: "", employment_type: "regular", employment_status: "active",
    contact_number: "", address: "", emergency_contact_name: "", emergency_contact_number: "",
    date_hired: "",
  });

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docRemarks, setDocRemarks] = useState("");
  const [uploading, setUploading] = useState(false);

  // History timeline state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Status Change state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState("active");
  const [statusReason, setStatusReason] = useState("");
  const [statusDate, setStatusDate] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    loadEmployeeDetails();
  }, [employeeId]);

  const loadEmployeeDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await employeeService.getById(employeeId);
      const data = res.data.employee;
      setEmployee(data);
      populateEditForm(data);
      if (activeTab === "history") loadHistory(data.id);
    } catch (err) {
      setErrorMsg("Failed to load employee 201 profile details.");
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (emp) => {
    setEditForm({
      name: emp.user?.name || "",
      email: emp.user?.email || "",
      department_id: emp.department_id || "",
      position: emp.position || "",
      salary: emp.salary || "0",
      employment_type: emp.employment_type || "regular",
      employment_status: emp.employment_status || "active",
      contact_number: emp.contact_number || "",
      address: emp.address || "",
      emergency_contact_name: emp.emergency_contact_name || "",
      emergency_contact_number: emp.emergency_contact_number || "",
      date_hired: emp.date_hired ? emp.date_hired.slice(0, 10) : "",
    });
  };

  const loadHistory = async (empId) => {
    setLoadingHistory(true);
    try {
      const res = await employeeService.getEditHistory(empId);
      setHistory(res.data.history || []);
    } catch (err) {
      console.warn("Failed to load edit history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history" && employee) {
      loadHistory(employee.id);
    }
  };

  // ── Update Profile Submit ─────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await employeeService.update(employee.id, editForm);
      setSuccessMsg("Employee 201 record updated successfully!");
      await loadEmployeeDetails();
      onUpdated?.();
    } catch (err) {
      const errRes = err.response?.data;
      setErrorMsg(errRes?.message || "Failed to update employee record. Check input values.");
    } finally {
      setSaving(false);
    }
  };

  // ── Status Tagging Change ─────────────────────────────────────────
  const handleOpenStatusModal = (status) => {
    setTargetStatus(status);
    setStatusReason("");
    setStatusDate(new Date().toISOString().slice(0, 10));
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    setUpdatingStatus(true);
    try {
      await employeeService.terminate(employee.id, {
        type: targetStatus,
        reason: statusReason,
        date: statusDate,
      });
      setStatusModalOpen(false);
      setSuccessMsg(`Employment status changed to ${targetStatus.toUpperCase()}.`);
      await loadEmployeeDetails();
      onUpdated?.();
    } catch (err) {
      setErrorMsg("Failed to update employment status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Document Upload ────────────────────────────────────────────────
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadingDoc) return;

    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("document_type", uploadingDoc);
    formData.append("file", selectedFile);
    if (docRemarks) formData.append("remarks", docRemarks);

    try {
      await employeeService.uploadDocument(employee.id, formData);
      setUploadingDoc(null);
      setSelectedFile(null);
      setDocRemarks("");
      setSuccessMsg("201 Document uploaded successfully.");
      await loadEmployeeDetails();
      onUpdated?.();
    } catch (err) {
      setErrorMsg("Failed to upload document. Max file size is 10MB (PDF/JPG/PNG/DOCX).");
    } finally {
      setUploading(false);
    }
  };

  // ── Document Download ──────────────────────────────────────────────
  const handleDownloadDocument = async (doc) => {
    try {
      const response = await employeeService.downloadDocument(employee.id, doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.original_name || `${doc.document_type}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error downloading file or file not found.");
    }
  };

  // ── Document Status Toggle (Verify/Reject) ─────────────────────────
  const handleVerifyDocument = async (docId, newStatus) => {
    try {
      await employeeService.updateDocumentStatus(employee.id, docId, { status: newStatus });
      await loadEmployeeDetails();
      onUpdated?.();
    } catch (err) {
      alert("Failed to update document status.");
    }
  };

  const empNumber = employee?.user?.employee_id || `EMP-${employee?.id}`;
  const empName = employee?.user?.name || "Employee Profile";
  const empEmail = employee?.user?.email || "N/A";
  const empDept = employee?.department?.department_name || employee?.department?.name || "Unassigned";

  // Calculate 201 Document Checklist Completion
  const docsList = employee?.documents || [];
  const totalRequired = Object.keys(DOC_TYPE_LABELS).length;
  const verifiedCount = docsList.filter(d => d.status === "verified").length;
  const submittedCount = docsList.filter(d => d.status === "submitted" || d.status === "verified").length;
  const checklistPercent = Math.round((submittedCount / totalRequired) * 100);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-auto transition-all duration-300">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="shrink-0 bg-gradient-to-r from-[#111A62] via-[#1a257c] to-[#0d1550] px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-white ring-2 ring-white/20">
              {empName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white truncate">{empName}</h2>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wide text-white">
                  {empNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3 flex-wrap">
                <span>{employee?.position || "Employee"}</span>
                <span>•</span>
                <span>{empDept}</span>
                <span>•</span>
                <span>{empEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge tone={STATUS_BADGES[employee?.employment_status]?.tone || "default"} className="px-3 py-1 text-xs">
              {STATUS_BADGES[employee?.employment_status]?.label || employee?.employment_status}
            </Badge>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                title="Close 201 File Panel & Expand Directory"
              >
                <FiX size={15} />
                <span>Close 201 File</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Navigation Header ───────────────────────────────────── */}
        <div className="mt-6 flex border-b border-white/15 gap-1 overflow-x-auto text-xs font-bold scrollable-content">
          <TabButton
            active={activeTab === "profile"}
            onClick={() => handleTabChange("profile")}
            icon={<FiUser />}
            label="201 Profile & Details"
          />
          <TabButton
            active={activeTab === "documents"}
            onClick={() => handleTabChange("documents")}
            icon={<FiFileText />}
            label={`201 Document Checklist (${submittedCount}/${totalRequired})`}
            badge={`${checklistPercent}%`}
          />
          <TabButton
            active={activeTab === "edit"}
            onClick={() => handleTabChange("edit")}
            icon={<FiEdit3 />}
            label="Edit Record"
          />
          <TabButton
            active={activeTab === "history"}
            onClick={() => handleTabChange("history")}
            icon={<FiClock />}
            label="Edit History Logs"
          />
        </div>
      </div>

      {/* ── Panel Content Body ──────────────────────────────────────── */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto bg-slate-50/50">
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <FiAlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <FiCheckCircle size={16} className="shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <FiLoader size={32} className="animate-spin text-[#111A62]" />
            <p className="text-sm font-medium">Loading Digital 201 File...</p>
          </div>
        ) : (
          <>
            {/* ── TAB 1: 201 PROFILE & DETAILS ─────────────────────── */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in">
                {/* Admin Status Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Employment Status Control</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      Current: <span className="font-extrabold text-[#111A62] capitalize">{employee?.employment_status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {employee?.employment_status !== "active" && (
                      <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100" onClick={() => handleOpenStatusModal("active")}>
                        <FiUserCheck className="mr-1" /> Mark Active
                      </Button>
                    )}
                    {employee?.employment_status !== "on_leave" && (
                      <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100" onClick={() => handleOpenStatusModal("on_leave")}>
                        <FiClock className="mr-1" /> Tag On Leave
                      </Button>
                    )}
                    {employee?.employment_status !== "resigned" && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100" onClick={() => handleOpenStatusModal("resigned")}>
                        <FiUserX className="mr-1" /> Record Resignation
                      </Button>
                    )}
                    {employee?.employment_status !== "terminated" && (
                      <Button size="sm" variant="danger" className="text-xs" onClick={() => handleOpenStatusModal("terminated")}>
                        <FiUserX className="mr-1" /> Terminate Employment
                      </Button>
                    )}
                  </div>
                </div>

                {/* Grid info cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard title="Employment Information" icon={<FiBriefcase />}>
                    <DetailRow label="Employee Number" value={empNumber} isMono />
                    <DetailRow label="Position" value={employee?.position || "—"} />
                    <DetailRow label="Department" value={empDept} />
                    <DetailRow label="Employment Type" value={employee?.employment_type ? employee.employment_type.toUpperCase() : "REGULAR"} />
                    <DetailRow label="Monthly Salary" value={`₱${Number(employee?.salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                    <DetailRow label="Date Hired" value={employee?.date_hired ? new Date(employee.date_hired).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} />
                  </InfoCard>

                  <InfoCard title="Personal & Contact Details" icon={<FiUser />}>
                    <DetailRow label="Full Name" value={empName} />
                    <DetailRow label="Email Address" value={empEmail} />
                    <DetailRow label="Contact Number" value={employee?.contact_number || "—"} />
                    <DetailRow label="Complete Address" value={employee?.address || "—"} />
                    <DetailRow label="Emergency Contact" value={employee?.emergency_contact_name || "—"} />
                    <DetailRow label="Emergency Phone" value={employee?.emergency_contact_number || "—"} />
                  </InfoCard>
                </div>

                {employee?.date_terminated && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600">Separation / Termination Notice</p>
                    <p className="mt-1 text-sm text-red-800">
                      <strong>Date Separated:</strong> {new Date(employee.date_terminated).toLocaleDateString()}
                    </p>
                    <p className="mt-0.5 text-xs text-red-700">
                      <strong>Reason:</strong> {employee.termination_reason || "No specific reason provided."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: 201 DOCUMENT CHECKLIST & STORAGE ───────────── */}
            {activeTab === "documents" && (
              <div className="space-y-6 animate-fade-in">
                {/* Progress bar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">201 Requirements Progress Tracker</h4>
                      <p className="text-xs text-slate-500">
                        {submittedCount} of {totalRequired} required 201 files submitted ({verifiedCount} verified by HR)
                      </p>
                    </div>
                    <span className="text-lg font-black text-[#111A62]">{checklistPercent}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${checklistPercent === 100 ? "bg-emerald-500" : checklistPercent > 50 ? "bg-[#111A62]" : "bg-amber-500"
                        }`}
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                </div>

                {/* Upload Section Modal inline if active */}
                {uploadingDoc && (
                  <form onSubmit={handleUploadDocument} className="rounded-2xl border-2 border-dashed border-[#111A62]/30 bg-[#111A62]/5 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-extrabold text-[#111A62] flex items-center gap-2">
                        <FiUploadCloud /> Upload Document: <span className="text-slate-800">{DOC_TYPE_LABELS[uploadingDoc] || uploadingDoc}</span>
                      </h4>
                      <button type="button" onClick={() => setUploadingDoc(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <FiX size={16} />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Choose File (Max 10MB PDF/Image/Doc)</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          required
                          className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#111A62] file:text-white hover:file:bg-[#0d1550]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Note (Optional)</label>
                        <input
                          type="text"
                          value={docRemarks}
                          onChange={(e) => setDocRemarks(e.target.value)}
                          placeholder="e.g. Verified original submitted"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setUploadingDoc(null)}>Cancel</Button>
                      <Button size="sm" variant="primary" type="submit" disabled={uploading}>
                        {uploading ? "Uploading..." : "Save to 201 File"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* 201 File Checklist Table */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Requirement</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">File Name</th>
                        <th className="px-4 py-3">Remarks</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {Object.entries(DOC_TYPE_LABELS).map(([typeKey, typeTitle]) => {
                        const doc = docsList.find(d => d.document_type === typeKey);
                        const status = doc?.status || "required";

                        return (
                          <tr key={typeKey} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {typeTitle}
                            </td>
                            <td className="px-4 py-3">
                              {status === "verified" ? (
                                <Badge tone="success" className="px-2 py-0.5 text-[10px]">✓ Verified</Badge>
                              ) : status === "submitted" ? (
                                <Badge tone="info" className="px-2 py-0.5 text-[10px]">Submitted</Badge>
                              ) : status === "rejected" ? (
                                <Badge tone="danger" className="px-2 py-0.5 text-[10px]">Rejected</Badge>
                              ) : (
                                <Badge tone="warning" className="px-2 py-0.5 text-[10px]">Required</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">
                              {doc?.original_name || (doc?.file_path ? doc.file_path.split("/").pop() : "—")}
                            </td>
                            <td className="px-4 py-3 text-slate-500 italic max-w-[180px] truncate">
                              {doc?.remarks || "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {doc?.file_path ? (
                                  <>
                                    <button
                                      onClick={() => handleDownloadDocument(doc)}
                                      title="Download File"
                                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                      <FiDownload size={13} />
                                    </button>
                                    {status !== "verified" && (
                                      <button
                                        onClick={() => handleVerifyDocument(doc.id, "verified")}
                                        title="Mark Verified"
                                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                                      >
                                        <FiCheck size={13} />
                                      </button>
                                    )}
                                  </>
                                ) : null}

                                <button
                                  onClick={() => {
                                    setUploadingDoc(typeKey);
                                    setSelectedFile(null);
                                    setDocRemarks(doc?.remarks || "");
                                  }}
                                  title="Upload / Replace File"
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                                >
                                  Upload
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 3: EDIT RECORD FORM ───────────────────────────── */}
            {activeTab === "edit" && (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employee Full Name *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                    <select
                      value={editForm.department_id}
                      onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      {(Array.isArray(departments) ? departments : []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.department_name || d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Position / Job Title *</label>
                    <input
                      type="text"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Salary (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.salary}
                      onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={editForm.employment_type}
                      onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none cursor-pointer"
                    >
                      <option value="regular">Regular</option>
                      <option value="probationary">Probationary</option>
                      <option value="contractual">Contractual</option>
                      <option value="project_based">Project-based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date Hired</label>
                    <input
                      type="date"
                      value={editForm.date_hired}
                      onChange={(e) => setEditForm({ ...editForm, date_hired: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={editForm.contact_number}
                      onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                      placeholder="0917xxxxxxx"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Complete Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Street, City, Province"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={editForm.emergency_contact_name}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Number</label>
                    <input
                      type="text"
                      value={editForm.emergency_contact_number}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_number: e.target.value })}
                      placeholder="0917xxxxxxx"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#111A62] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("profile")}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving Changes..." : "Save 201 File Changes"}
                  </Button>
                </div>
              </form>
            )}

            {/* ── TAB 4: EDIT HISTORY TIMELINE ──────────────────────── */}
            {activeTab === "history" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Audit & Change History Logs</h4>
                  <span className="text-xs text-slate-500">{history.length} events logged</span>
                </div>

                {loadingHistory ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading history logs...</div>
                ) : history.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                    No change history logs recorded for this employee yet.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 pl-4 space-y-4 ml-2">
                    {history.map((log) => (
                      <div key={log.id} className="relative group">
                        <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#111A62]" />
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{log.description}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Action by: <strong className="text-slate-700">{log.user?.name || "System Admin"}</strong>
                          </p>

                          {log.old_values && log.new_values && (
                            <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] font-mono text-slate-600 space-y-0.5 overflow-x-auto">
                              <p className="font-bold text-slate-500 mb-1">Field Changes:</p>
                              {Object.keys(log.new_values).map((key) => {
                                if (log.old_values[key] === log.new_values[key]) return null;
                                return (
                                  <div key={key} className="flex gap-2">
                                    <span className="font-semibold text-slate-700">{key}:</span>
                                    <span className="text-red-500 line-through">{String(log.old_values[key] ?? "null")}</span>
                                    <span>→</span>
                                    <span className="text-emerald-600 font-bold">{String(log.new_values[key] ?? "null")}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Status Change Confirmation Sub-Modal ─────────────────────── */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-extrabold text-slate-900">
              Update Status to <span className="capitalize text-[#111A62]">{targetStatus}</span>?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Updating employment status will affect system access permissions and active employee lists.
            </p>

            {(targetStatus === "resigned" || targetStatus === "terminated") && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective Date *</label>
                  <input
                    type="date"
                    value={statusDate}
                    onChange={(e) => setStatusDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Notes *</label>
                  <textarea
                    rows={3}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    required
                    placeholder="Provide details for official HR records..."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                variant={targetStatus === "active" ? "primary" : "danger"}
                onClick={handleConfirmStatusChange}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Updating..." : "Confirm Status Change"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl transition border-b-2 cursor-pointer ${active
        ? "bg-white text-[#111A62] border-white font-extrabold shadow-2xs"
        : "text-slate-300 border-transparent hover:text-white hover:bg-white/10"
        }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${active ? "bg-[#111A62] text-white" : "bg-white/20 text-white"
          }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
        <span className="text-[#111A62]">{icon}</span>
        <span>{title}</span>
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, isMono }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
      <span className="text-slate-500 font-medium">{label}:</span>
      <span className={`text-slate-900 font-bold truncate max-w-[200px] ${isMono ? "font-mono text-slate-800" : ""}`}>
        {value}
      </span>
    </div>
  );
}
