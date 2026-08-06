import { useState, useEffect, useCallback } from "react";
import {
  FiUsers, FiUserCheck, FiUserX, FiClock, FiPlus,
  FiFileText, FiRefreshCw, FiChevronRight, FiLoader, FiSearch, FiX
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Employee201Panel from "../../components/employee/Employee201Panel";
import Modal from "../../components/ui/Modal";
import employeeService from "../../services/employeeService";
import api from "../../services/api";

const STATUS_TONES = {
  active: "success",
  on_leave: "warning",
  resigned: "danger",
  terminated: "danger",
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [allEmployeesList, setAllEmployeesList] = useState([]); // for sidebar selection
  const [stats, setStats] = useState({ total: 0, active: 0, on_leave: 0, resigned: 0, terminated: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Departments list for filter / forms
  const [departments, setDepartments] = useState([]);

  // Selected Employee 201 File state for Split View
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [isScrolled, setIsScrolled]       = useState(false);

  // Create Employee Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", email: "", department_id: "", position: "",
    salary: "", employment_type: "regular", date_hired: new Date().toISOString().slice(0, 10),
    contact_number: "", address: "", emergency_contact_name: "", emergency_contact_number: ""
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 150;
      if (isScrollable && window.scrollY > 100) {
        setIsScrolled(true);
      } else if (window.scrollY < 20) {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
        search,
        status: statusFilter !== "All" ? statusFilter : undefined,
      };
      const res = await employeeService.getAll(params);
      if (res.data.employees) {
        setEmployees(res.data.employees.data || []);
        setAllEmployeesList(res.data.employees.data || []);
        setTotalItems(res.data.employees.total || 0);
        setStats(res.data.stats || { total: 0, active: 0, on_leave: 0, resigned: 0, terminated: 0 });
      } else {
        const list = res.data.data || res.data || [];
        setEmployees(list);
        setAllEmployeesList(list);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    // Load departments list for options
    api.get("/departments")
      .then(res => {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setDepartments(list);
      })
      .catch(() => setDepartments([]));
  }, []);

  const handleSelectEmployee = (empId) => {
    setSelectedEmpId(empId);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await employeeService.create(createForm);
      setCreateModalOpen(false);
      setCreateForm({
        name: "", email: "", department_id: "", position: "",
        salary: "", employment_type: "regular", date_hired: new Date().toISOString().slice(0, 10),
        contact_number: "", address: "", emergency_contact_name: "", emergency_contact_number: ""
      });
      fetchEmployees();
      if (res.data?.employee?.id) {
        setSelectedEmpId(res.data.employee.id);
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create employee record. Verify all fields.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Page Title Header & Summary Stats Collapsible Container ── */}
      <div className={`transition-all duration-500 ease-in-out ${isScrolled ? "max-h-0 opacity-0 overflow-hidden pointer-events-none -translate-y-4 space-y-0" : "max-h-[600px] opacity-100 translate-y-0 space-y-5"}`}>
        {/* Page Title Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Workforce & 201 Management</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Digital 201 Employee Records</h1>
            <p className="mt-1 text-sm text-slate-500">Auto-generated employee files, document checklist tracking, and status controls.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchEmployees} className="gap-1 text-slate-600 bg-white shadow-2xs">
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5 bg-[#111A62]">
              <FiPlus size={16} /> Add Employee Record
            </Button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid gap-3 sm:grid-cols-4 animate-fade-in">
          <SummaryCard icon={<FiUsers />} label="Total Employees" value={stats.total} tone="bg-blue-50 text-blue-700" />
          <SummaryCard icon={<FiUserCheck />} label="Active Staff" value={stats.active} tone="bg-emerald-50 text-emerald-700" />
          <SummaryCard icon={<FiClock />} label="On Leave" value={stats.on_leave} tone="bg-amber-50 text-amber-700" />
          <SummaryCard icon={<FiUserX />} label="Resigned / Terminated" value={stats.resigned + stats.terminated} tone="bg-red-50 text-red-700" />
        </div>
      </div>

      {/* ── Split-Screen Master-Detail Layout ──────────────────────── */}
      <div className={`grid gap-5 transition-all duration-300 lg:grid-cols-12 ${selectedEmpId ? "h-[calc(100vh-8.5rem)] min-h-[550px]" : ""}`}>

        {/* ── LEFT SIDE: DIRECTORY (Full Table or Sidebar List) ────── */}
        <div className={`transition-all duration-300 ${selectedEmpId ? "lg:col-span-4 h-full min-h-0" : "lg:col-span-12"}`}>

          {selectedEmpId ? (
            /* ── COMPACT SIDEBAR LIST (When 201 File panel is open) ─ */
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 animate-fade-in flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Employee Directory</h3>
                  <p className="text-[11px] text-slate-400">Click any employee to view 201 file</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isScrolled && (
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="rounded-lg border border-[#111A62]/20 bg-[#111A62]/5 px-2 py-1 text-[10px] font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-0.5 cursor-pointer"
                      title="Scroll to top to view Stats & Header"
                    >
                      ↑ Stats
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedEmpId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    title="Expand to Full Table"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="space-y-2 shrink-0">
                <SearchBar
                  value={search}
                  onChange={(val) => { setSearch(val); setPage(1); }}
                  placeholder="Search name or ID..."
                  className="text-xs"
                />

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                  {["All", "active", "on_leave", "resigned"].map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setPage(1); }}
                      className={`rounded-full px-2.5 py-0.5 border transition cursor-pointer shrink-0 ${statusFilter === s
                        ? "bg-[#111A62] text-white border-[#111A62]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      {s === "All" ? "All" : s.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Scrollable Sidebar List */}
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <FiLoader size={16} className="animate-spin text-[#111A62]" /> Loading staff list...
                  </div>
                ) : employees.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No employees match filter.</div>
                ) : (
                  employees.map((e) => {
                    const empNum = e.user?.employee_id || `EMP-${e.id}`;
                    const empName = e.user?.name || "Employee";
                    const isSelected = e.id === selectedEmpId;

                    return (
                      <div
                        key={e.id}
                        onClick={() => handleSelectEmployee(e.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl transition cursor-pointer border ${isSelected
                          ? "border-[#111A62] bg-[#111A62]/10 ring-2 ring-[#111A62]/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${isSelected ? "bg-[#111A62] text-white" : "bg-slate-100 text-[#111A62]"
                            }`}>
                            {empName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-xs font-extrabold truncate ${isSelected ? "text-[#111A62]" : "text-slate-900"}`}>
                              {empName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400">{empNum}</span>
                              <span className="text-[10px] text-slate-500 truncate">{e.position}</span>
                            </div>
                          </div>
                        </div>

                        <Badge tone={STATUS_TONES[e.employment_status] || "default"} className="text-[9px] px-1.5 py-0.2 shrink-0">
                          {e.employment_status ? e.employment_status.toUpperCase() : "ACTIVE"}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ── FULL TABLE DIRECTORY (When no 201 File is open) ───── */
            <Card className={`animate-fade-in transition-all duration-300 ${isScrolled && !selectedEmpId ? "sticky top-4 z-20 shadow-2xl ring-1 ring-slate-900/10 border-slate-300 bg-white" : ""}`}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FiFileText className="text-[#111A62]" /> 201 Employee Directory
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {isScrolled && !selectedEmpId && (
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="rounded-lg border border-[#111A62]/20 bg-[#111A62]/5 px-2.5 py-1 text-xs font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-1 cursor-pointer mr-2"
                        title="Scroll to top to view Stats & Header"
                      >
                        ↑ Show Header & Stats
                      </button>
                    )}
                    {["All", "active", "on_leave", "resigned", "terminated"].map(s => (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={`rounded-full px-3 py-1 text-xs font-bold border transition cursor-pointer ${statusFilter === s
                          ? "bg-[#111A62] text-white border-[#111A62]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {s === "All" ? "All Status" : s.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                    <div className="w-60">
                      <SearchBar
                        value={search}
                        onChange={(val) => { setSearch(val); setPage(1); }}
                        placeholder="Search name, ID, position..."
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <THead>
                    <tr>
                      <TH>Employee ID & Name</TH>
                      <TH>Department</TH>
                      <TH>Position</TH>
                      <TH>Salary</TH>
                      <TH>Date Hired</TH>
                      <TH>201 Files</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Action</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <TD colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="flex items-center justify-center gap-2">
                            <FiLoader size={18} className="animate-spin text-[#111A62]" />
                            <span>Loading 201 employee records...</span>
                          </div>
                        </TD>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <TD colSpan={8} className="py-12 text-center text-slate-400">
                          No employee records found matching your filters.
                        </TD>
                      </tr>
                    ) : (
                      employees.map((e) => {
                        const empNum = e.user?.employee_id || `EMP-${e.id}`;
                        const empName = e.user?.name || "Employee";
                        const dept = e.department?.department_name || e.department?.name || "Unassigned";
                        const docs = e.documents || [];
                        const verifiedCount = docs.filter(d => d.status === "verified").length;

                        return (
                          <tr
                            key={e.id}
                            onClick={() => handleSelectEmployee(e.id)}
                            className="hover:bg-slate-50/80 transition cursor-pointer group"
                          >
                            <TD>
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111A62]/10 text-xs font-black text-[#111A62]">
                                  {empName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-900 group-hover:text-[#111A62] transition">{empName}</p>
                                  <p className="text-xs font-mono font-bold text-slate-400">{empNum}</p>
                                </div>
                              </div>
                            </TD>
                            <TD className="text-slate-700 font-medium">{dept}</TD>
                            <TD className="text-slate-700 font-medium">{e.position}</TD>
                            <TD className="text-slate-900 font-mono font-semibold text-xs">
                              ₱{Number(e.salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </TD>
                            <TD className="text-slate-500 text-xs font-medium">
                              {e.date_hired ? new Date(e.date_hired).toLocaleDateString() : "—"}
                            </TD>
                            <TD>
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                                <FiFileText size={12} className="text-[#111A62]" /> {verifiedCount}/10 Verified
                              </span>
                            </TD>
                            <TD>
                              <Badge tone={STATUS_TONES[e.employment_status] || "default"}>
                                {e.employment_status ? e.employment_status.toUpperCase() : "ACTIVE"}
                              </Badge>
                            </TD>
                            <TD className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(evt) => { evt.stopPropagation(); handleSelectEmployee(e.id); }}
                                className="text-xs text-[#111A62] hover:bg-[#111A62]/10 font-bold cursor-pointer"
                              >
                                View 201 File <FiChevronRight size={14} />
                              </Button>
                            </TD>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>

                {totalItems > 10 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Pagination
                      page={page}
                      pageSize={10}
                      total={totalItems}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT SIDE: DIGITAL 201 FILE PANEL (Smooth Slide In) ──── */}
        {selectedEmpId && (
          <div className="lg:col-span-8 animate-slide-up transition-all duration-300 h-full min-h-0">
            <Employee201Panel
              employeeId={selectedEmpId}
              departments={departments}
              onClose={() => setSelectedEmpId(null)}
              onUpdated={fetchEmployees}
            />
          </div>
        )}

      </div>

      {/* ── Create Employee Modal ────────────────────────────────────── */}
      {createModalOpen && (
        <Modal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Employee & 201 Record"
          description="Auto-assigns employee number (EMP-YYYY-XXXXX) and initializes 201 document checklist."
          className="max-w-xl"
        >
          <form onSubmit={handleCreateEmployee} className="space-y-4 pt-2">
            {createError && (
              <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {createError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  placeholder="john@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={createForm.department_id}
                  onChange={e => setCreateForm({ ...createForm, department_id: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.department_name || d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Position Title *</label>
                <input
                  type="text"
                  value={createForm.position}
                  onChange={e => setCreateForm({ ...createForm, position: e.target.value })}
                  required
                  placeholder="Software Engineer"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Salary (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.salary}
                  onChange={e => setCreateForm({ ...createForm, salary: e.target.value })}
                  required
                  placeholder="30000.00"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date Hired *</label>
                <input
                  type="date"
                  value={createForm.date_hired}
                  onChange={e => setCreateForm({ ...createForm, date_hired: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                <select
                  value={createForm.employment_type}
                  onChange={e => setCreateForm({ ...createForm, employment_type: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="regular">Regular</option>
                  <option value="probationary">Probationary</option>
                  <option value="contractual">Contractual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={createForm.contact_number}
                  onChange={e => setCreateForm({ ...createForm, contact_number: e.target.value })}
                  placeholder="0917xxxxxxx"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={creating} className="bg-[#111A62]">
                {creating ? "Creating Record..." : "Create & Open 201 File"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${tone}`}>{icon}</div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
