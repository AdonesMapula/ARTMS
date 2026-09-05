import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Database,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Filter,
  ShieldAlert,
  Server,
  Zap,
  Check,
  X,
  Sparkles,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  Info,
  Clock,
  Eye,
  CheckSquare,
  Square,
  ShieldCheck,
  TableProperties,
  ArrowUpDown,
  Code2,
  SlidersHorizontal,
  Maximize2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import ActionLoadingModal from "../../components/ui/ActionLoadingModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import developerService from "../../services/developerService";
import { useToast } from "../../context/ToastContext";

const CATEGORY_META = {
  all: { label: "All Tables", color: "navy" },
  recruitment: { label: "Recruitment", color: "blue" },
  workforce: { label: "Workforce & HR", color: "emerald" },
  core_system: { label: "Core System / Auth", color: "purple" },
  communications: { label: "Communications", color: "amber" },
  audit_logs: { label: "Audit Logs", color: "rose" },
  other: { label: "Other", color: "slate" },
};

const CATEGORY_TONE = {
  recruitment: "info",
  workforce: "success",
  core_system: "purple",
  communications: "warning",
  audit_logs: "danger",
  other: "default",
};

export default function DatabaseManager() {
  const toast = useToast();

  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"

  // Multi-table selection for bulk deletion / actions
  const [selectedTables, setSelectedTables] = useState([]);

  // Excluded Tables state for Fast Purge
  const [excludedTables, setExcludedTables] = useState([
    "users",
    "departments",
    "permissions",
    "custom_roles",
    "role_permissions",
    "migrations",
  ]);

  // Live Table Inspector State
  const [inspectTable, setInspectTable] = useState(null); // Table name string or null
  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [tableDataError, setTableDataError] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [tableDataPage, setTableDataPage] = useState(1);
  const [tableDataPerPage, setTableDataPerPage] = useState(15);
  const [tableDataSearch, setTableDataSearch] = useState("");
  const [tableDataSortBy, setTableDataSortBy] = useState("");
  const [tableDataSortDir, setTableDataSortDir] = useState("desc");

  // Modals state
  const [singleTruncateModal, setSingleTruncateModal] = useState({ open: false, table: null });
  const [bulkTruncateModal, setBulkTruncateModal] = useState({ open: false, tables: [] });
  const [purgeExceptModal, setPurgeExceptModal] = useState(false);
  const [presetModal, setPresetModal] = useState({ open: false, presetKey: "", presetTitle: "", affectedTables: [] });
  const [reseedModal, setReseedModal] = useState({ open: false, seeder: "", title: "" });

  // Confirmation Text for Safety
  const [confirmInput, setConfirmInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Alert Modal
  const [alertState, setAlertState] = useState({ open: false, variant: "success", title: "", message: "" });
  const showAlert = (variant, title, message) => setAlertState({ open: true, variant, title, message });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const data = await developerService.getTables();
      setDbData(data);
    } catch (err) {
      console.error("Failed to load tables:", err);
      toast.error("Failed to load database schema.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const filteredTables = useMemo(() => {
    if (!dbData?.tables) return [];
    return dbData.tables.filter((t) => {
      const matchesSearch = !q || t.name.toLowerCase().includes(q.toLowerCase());
      const matchesCat = categoryFilter === "all" || t.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [dbData, q, categoryFilter]);

  // ── Multi-select table logic ──────────────────────────────────
  const isAllFilteredSelected = useMemo(() => {
    const selectable = filteredTables.filter((t) => t.name.toLowerCase() !== "migrations");
    if (selectable.length === 0) return false;
    return selectable.every((t) => selectedTables.includes(t.name));
  }, [filteredTables, selectedTables]);

  const handleToggleSelectAll = () => {
    const selectable = filteredTables
      .filter((t) => t.name.toLowerCase() !== "migrations")
      .map((t) => t.name);

    if (isAllFilteredSelected) {
      // Uncheck all in current filter
      setSelectedTables((prev) => prev.filter((t) => !selectable.includes(t)));
    } else {
      // Check all in current filter
      setSelectedTables((prev) => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const handleToggleSelectTable = (tableName) => {
    if (tableName.toLowerCase() === "migrations") return;
    setSelectedTables((prev) =>
      prev.includes(tableName) ? prev.filter((t) => t !== tableName) : [...prev, tableName]
    );
  };

  const handleDeselectAll = () => {
    setSelectedTables([]);
  };

  const handleAddSelectedToExclusions = () => {
    setExcludedTables((prev) => Array.from(new Set([...prev, ...selectedTables.map((t) => t.toLowerCase())])));
    toast.success("Protected Tables Updated", `${selectedTables.length} tables added to purge exclusion list.`);
    setSelectedTables([]);
  };

  const handleRemoveSelectedFromExclusions = () => {
    const selectedLower = selectedTables.map((t) => t.toLowerCase());
    setExcludedTables((prev) => prev.filter((t) => !selectedLower.includes(t) || t === "migrations"));
    toast.info("Exclusions Updated", `${selectedTables.length} tables removed from protection list.`);
    setSelectedTables([]);
  };

  // ── Exclusions Toggle ─────────────────────────────────────────
  const toggleExcludeTable = (tableName) => {
    const lower = tableName.toLowerCase();
    if (lower === "migrations") return; // migrations always excluded
    setExcludedTables((prev) =>
      prev.includes(lower) ? prev.filter((t) => t !== lower) : [...prev, lower]
    );
  };

  // ── Live Table Inspector Fetcher ──────────────────────────────
  const loadTableData = useCallback(
    async (tableName, pageNum = 1, search = tableDataSearch, sortBy = tableDataSortBy, sortDir = tableDataSortDir, perPage = tableDataPerPage) => {
      if (!tableName) return;
      setTableDataLoading(true);
      setTableDataError(null);
      try {
        const res = await developerService.getTableData(tableName, {
          page: pageNum,
          per_page: perPage,
          search: search || undefined,
          sort_by: sortBy || undefined,
          sort_dir: sortDir || undefined,
        });
        setTableData(res);
        setTableDataPage(res.current_page || pageNum);
      } catch (err) {
        console.error("Failed loading table data:", err);
        setTableDataError(err.response?.data?.message || "Failed to load records from table.");
      } finally {
        setTableDataLoading(false);
      }
    },
    [tableDataSearch, tableDataSortBy, tableDataSortDir, tableDataPerPage]
  );

  const handleOpenInspector = (tableName) => {
    setInspectTable(tableName);
    setTableDataSearch("");
    setTableDataSortBy("");
    setTableDataPage(1);
    loadTableData(tableName, 1, "", "", "desc", tableDataPerPage);
  };

  const handleTableDataSearchSubmit = (e) => {
    e?.preventDefault();
    loadTableData(inspectTable, 1, tableDataSearch, tableDataSortBy, tableDataSortDir, tableDataPerPage);
  };

  const handleTableDataSort = (colName) => {
    const nextDir = tableDataSortBy === colName && tableDataSortDir === "desc" ? "asc" : "desc";
    setTableDataSortBy(colName);
    setTableDataSortDir(nextDir);
    loadTableData(inspectTable, 1, tableDataSearch, colName, nextDir, tableDataPerPage);
  };

  // ── Actions: Truncate Single ──────────────────────────────────
  const handleExecuteSingleTruncate = async () => {
    if (!singleTruncateModal.table) return;
    const tName = singleTruncateModal.table.name;
    setActionLoading(true);
    setActionMessage(`Truncating table \`${tName}\` and resetting auto-increment...`);
    try {
      const res = await developerService.truncateTable(tName);
      toast.success("Table Truncated", res.message || `Table \`${tName}\` cleared.`);
      setSingleTruncateModal({ open: false, table: null });
      fetchTables();
      if (inspectTable === tName) {
        loadTableData(tName, 1);
      }
    } catch (err) {
      showAlert("error", "Truncate Failed", err.response?.data?.message || "Failed to truncate table.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Actions: Bulk Truncate Selected ───────────────────────────
  const handleExecuteBulkTruncate = async () => {
    if (confirmInput.trim().toUpperCase() !== "DELETE") {
      toast.error("Please type DELETE to confirm bulk table truncation.");
      return;
    }
    const tablesToWipe = bulkTruncateModal.tables;
    if (tablesToWipe.length === 0) return;

    setActionLoading(true);
    setActionMessage(`Truncating ${tablesToWipe.length} selected tables & resetting ID sequences...`);
    try {
      const res = await developerService.bulkTruncate(tablesToWipe);
      showAlert(
        "success",
        "Bulk Truncate Complete",
        res.message || `Successfully cleared ${res.tables?.length || 0} tables.`
      );
      setBulkTruncateModal({ open: false, tables: [] });
      setSelectedTables([]);
      setConfirmInput("");
      fetchTables();
      if (inspectTable && tablesToWipe.includes(inspectTable)) {
        loadTableData(inspectTable, 1);
      }
    } catch (err) {
      showAlert("error", "Bulk Truncate Failed", err.response?.data?.message || "Failed to truncate selected tables.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Actions: Purge Except ─────────────────────────────────────
  const handleExecutePurgeExcept = async () => {
    if (confirmInput.trim().toUpperCase() !== "PURGE") {
      toast.error("Please type PURGE to confirm.");
      return;
    }
    setActionLoading(true);
    setActionMessage("Purging database tables with exclusions & resetting auto-increment sequences...");
    try {
      const res = await developerService.purgeExcept(excludedTables);
      showAlert(
        "success",
        "Database Purge Complete",
        res.message || `Successfully cleared ${res.truncated_tables?.length || 0} tables.`
      );
      setPurgeExceptModal(false);
      setConfirmInput("");
      fetchTables();
      if (inspectTable) {
        loadTableData(inspectTable, 1);
      }
    } catch (err) {
      showAlert("error", "Purge Failed", err.response?.data?.message || "Failed to purge database.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Actions: Preset Purge ─────────────────────────────────────
  const handleExecutePreset = async () => {
    if (!presetModal.presetKey) return;
    setActionLoading(true);
    setActionMessage(`Executing preset purge [${presetModal.presetTitle}]...`);
    try {
      const res = await developerService.purgePreset(presetModal.presetKey);
      showAlert("success", "Preset Purge Complete", res.message || "Target tables cleared.");
      setPresetModal({ open: false, presetKey: "", presetTitle: "", affectedTables: [] });
      fetchTables();
      if (inspectTable) {
        loadTableData(inspectTable, 1);
      }
    } catch (err) {
      showAlert("error", "Preset Failed", err.response?.data?.message || "Failed to execute preset.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Actions: Reseed ───────────────────────────────────────────
  const handleExecuteReseed = async () => {
    if (!reseedModal.seeder) return;
    setActionLoading(true);
    setActionMessage(`Running seeder \`${reseedModal.seeder}\`...`);
    try {
      const res = await developerService.reseed(reseedModal.seeder);
      showAlert("success", "Reseed Completed", res.message || "Seeder executed successfully.");
      setReseedModal({ open: false, seeder: "", title: "" });
      fetchTables();
      if (inspectTable) {
        loadTableData(inspectTable, 1);
      }
    } catch (err) {
      showAlert("error", "Reseed Failed", err.response?.data?.message || "Failed to run seeder.");
    } finally {
      setActionLoading(false);
    }
  };

  const tablesToWipeInPurgeExcept = useMemo(() => {
    if (!dbData?.tables) return [];
    return dbData.tables.filter((t) => !excludedTables.includes(t.name.toLowerCase()));
  }, [dbData, excludedTables]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center rounded-md bg-amber-500/10 px-2 text-[11px] font-black uppercase tracking-wider text-amber-600 border border-amber-500/20">
              <Zap size={12} className="mr-1" /> Developer Zone
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Driver: {dbData?.driver?.toUpperCase() || "MYSQL"}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl flex items-center gap-2.5">
            <Database className="text-[#111A62]" size={28} /> Database Management & Live Inspector
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Click any table to inspect live records inside the database, execute bulk deletion with Check All, or purge with custom exclusions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={loading || refreshing}
            className="gap-2 bg-white cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing || loading ? "animate-spin" : ""} />
            <span>Refresh Schema</span>
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              setConfirmInput("");
              setPurgeExceptModal(true);
            }}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer"
          >
            <ShieldAlert size={16} />
            <span>Delete Everything Except... ({excludedTables.length} Protected)</span>
          </Button>
        </div>
      </div>

      {/* ── System Overview Stats Cards ────────────────────────────── */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Database Name</p>
              <h3 className="text-lg font-bold text-[#111A62] dark:text-blue-400 mt-0.5 font-mono">
                {dbData?.database || "artms_db"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active Connection</p>
            </div>
            <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#111A62] dark:text-blue-400">
              <Server size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tables</p>
              <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {loading ? "..." : dbData?.total_tables || 0}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Mapped Schemas</p>
            </div>
            <div className="p-2.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Layers size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Records</p>
              <h3 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {loading ? "..." : (dbData?.total_rows || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Rows across all tables</p>
            </div>
            <div className="p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Storage Footprint</p>
              <h3 className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {loading ? "..." : dbData?.total_size_human || "0 B"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Data & Index size</p>
            </div>
            <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <HardDrive size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Fast Presets Panel ─────────────────────────────────────── */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Fast Purge & Reseed Presets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Targeted single-click cleanup for specific subsystems with automatic sequence resets.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 px-2.5 py-1 rounded-md self-start md:self-auto">
              <Info size={12} /> Auto-Increment Reset & Cache Flush Included
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPresetModal({
                  open: true,
                  presetKey: "recruitment",
                  presetTitle: "Recruitment Module Purge",
                  affectedTables: ["applicants", "ai_evaluations", "interviews", "job_postings", "job_library", "manpower_requests"],
                })
              }
              className="bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold gap-1.5 cursor-pointer text-xs h-8"
            >
              <Trash2 size={12} /> Purge Recruitment (Jobs, PRFs, Applicants)
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPresetModal({
                  open: true,
                  presetKey: "workforce",
                  presetTitle: "Workforce & Payroll Purge",
                  affectedTables: ["employees", "attendances", "leaves", "payrolls"],
                })
              }
              className="bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold gap-1.5 cursor-pointer text-xs h-8"
            >
              <Trash2 size={12} /> Purge Workforce (Employees, Attendance, Payroll)
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPresetModal({
                  open: true,
                  presetKey: "communications",
                  presetTitle: "Communications Purge",
                  affectedTables: ["messages", "conversations", "notifications"],
                })
              }
              className="bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold gap-1.5 cursor-pointer text-xs h-8"
            >
              <Trash2 size={12} /> Purge Messages & Notifications
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPresetModal({
                  open: true,
                  presetKey: "all_except_system",
                  presetTitle: "Wipe All Except System Auth (Keep Users & Depts)",
                  affectedTables: ["applicants", "jobs", "employees", "attendances", "messages", "leaves", "payrolls"],
                })
              }
              className="bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-semibold gap-1.5 cursor-pointer text-xs h-8"
            >
              <ShieldAlert size={12} /> Wipe All Except Core Auth & Roles
            </Button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 self-center hidden sm:block" />

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setReseedModal({
                  open: true,
                  seeder: "JobPostingSeeder",
                  title: "Reseed 15 Job Templates & Published Postings",
                })
              }
              className="bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold gap-1.5 cursor-pointer text-xs h-8"
            >
              <RotateCcw size={12} /> Reseed 15 Job Templates
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setReseedModal({
                  open: true,
                  seeder: "ApplicantSeeder",
                  title: "Reseed Demo Applicants",
                })
              }
              className="bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold gap-1.5 cursor-pointer text-xs h-8"
            >
              <RotateCcw size={12} /> Reseed Demo Applicants
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Active Bulk Selection Floating Toolbar ─────────────────── */}
      {selectedTables.length > 0 && (
        <div className="sticky top-4 z-40 rounded-lg bg-slate-900 dark:bg-slate-950 text-white p-3 shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500 text-white font-mono font-bold text-xs">
              {selectedTables.length}
            </div>
            <div>
              <p className="text-xs font-bold">
                {selectedTables.length} {selectedTables.length === 1 ? "Table" : "Tables"} Selected
              </p>
              <p className="text-[10px] text-slate-400">
                Execute batch actions on the selected tables simultaneously.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => {
                setConfirmInput("");
                setBulkTruncateModal({ open: true, tables: selectedTables });
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 cursor-pointer text-xs h-7.5"
            >
              <Trash2 size={12} /> Delete Selected ({selectedTables.length})
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleAddSelectedToExclusions}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-semibold gap-1.5 cursor-pointer text-xs h-7.5"
            >
              <ShieldCheck size={12} /> Protect from Purge
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRemoveSelectedFromExclusions}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-semibold gap-1.5 cursor-pointer text-xs h-7.5"
            >
              <X size={12} /> Remove Protection
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeselectAll}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs cursor-pointer h-7.5"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* ── Active Exclusions Bar ──────────────────────────────────── */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400 shrink-0" size={16} />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-200">
                Protected Exclusions for Bulk Purge ({excludedTables.length} tables protected)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                These tables will be safely skipped whenever "Delete Everything Except..." is executed.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {excludedTables.map((tbl) => (
              <span
                key={tbl}
                className={`inline-flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                  tbl === "migrations"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-700"
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40"
                }`}
              >
                {tbl}
                {tbl !== "migrations" && (
                  <button
                    onClick={() => toggleExcludeTable(tbl)}
                    className="text-emerald-700/60 dark:text-emerald-400/60 hover:text-emerald-900 dark:hover:text-emerald-300 cursor-pointer ml-0.5"
                    title="Remove from exclusions"
                  >
                    <X size={11} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Database Tables Explorer ───────────────────────────────── */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 py-3 px-4 sm:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="text-[#111A62] dark:text-blue-400" size={16} /> 
                <span>Tables & Live Inspector</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredTables.length}
                </span>
              </CardTitle>
            </div>

            {/* Controls: Search, Check All, Category Filter & View Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="w-full sm:w-52">
                <SearchBar
                  value={q}
                  onChange={setQ}
                  placeholder="Search table name..."
                  className="h-8.5 text-xs"
                />
              </div>

              {/* Master Check All Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSelectAll}
                className="h-8.5 text-xs font-semibold gap-1.5 bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shrink-0"
              >
                {isAllFilteredSelected ? (
                  <>
                    <CheckSquare size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>Uncheck All ({filteredTables.length})</span>
                  </>
                ) : (
                  <>
                    <Square size={13} className="text-slate-400" />
                    <span>Check All ({filteredTables.length})</span>
                  </>
                )}
              </Button>

              {/* Category Pills */}
              <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700 overflow-x-auto">
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(key)}
                    className={`px-2 py-1 text-xs font-semibold rounded transition-all whitespace-nowrap cursor-pointer ${
                      categoryFilter === key
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded transition cursor-pointer ${
                    viewMode === "list" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                  title="List View"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded transition cursor-pointer ${
                    viewMode === "grid" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-slate-300" />
              <p className="text-xs font-semibold">Reading database schema & table statistics...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="py-12 text-center">
              <Database size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No tables match your filter</p>
            </div>
          ) : viewMode === "list" ? (
            /* ── Table View ── */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-[#111A62] focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        title="Check All Filtered Tables"
                      />
                    </TableHead>
                    <TableHead className="w-14 text-center">Protected</TableHead>
                    <TableHead className="min-w-[200px]">Table Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Live Rows</TableHead>
                    <TableHead className="text-right">Storage Size</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTables.map((tbl) => {
                    const isProtected = excludedTables.includes(tbl.name.toLowerCase());
                    const isMigration = tbl.name.toLowerCase() === "migrations";
                    const isSelected = selectedTables.includes(tbl.name);

                    return (
                      <TableRow
                        key={tbl.name}
                        onClick={() => handleOpenInspector(tbl.name)}
                        className={`cursor-pointer transition-colors ${
                          inspectTable === tbl.name
                            ? "bg-blue-50/80 border-l-4 border-l-[#111A62]"
                            : isSelected
                            ? "bg-blue-50/40"
                            : "hover:bg-slate-50/70"
                        }`}
                      >
                        {/* Select for batch action */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isMigration}
                            onChange={() => handleToggleSelectTable(tbl.name)}
                            className="rounded border-slate-300 text-[#111A62] focus:ring-blue-500 h-4 w-4 cursor-pointer disabled:opacity-30"
                            title="Select table for bulk action"
                          />
                        </TableCell>

                        {/* Protected / Excluded toggle */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isProtected}
                            disabled={isMigration}
                            onChange={() => toggleExcludeTable(tbl.name)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer disabled:opacity-40"
                            title={isProtected ? "Protected from bulk purge" : "Will be truncated during bulk purge"}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-[#111A62] hover:underline">
                              {tbl.name}
                            </span>
                            {isProtected && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded uppercase">
                                Protected
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge tone={CATEGORY_TONE[tbl.category] || "default"} className="text-[10px] capitalize">
                            {tbl.category.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              tbl.rows > 0
                                ? "bg-blue-50 text-blue-700 font-extrabold"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {tbl.rows.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600">
                          {tbl.size_human}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono">
                          {tbl.engine}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenInspector(tbl.name)}
                              className="h-7 px-2 text-xs text-[#111A62] hover:bg-blue-50 font-bold gap-1 cursor-pointer"
                              title={`Inspect live data in ${tbl.name}`}
                            >
                              <Eye size={12} />
                              <span>View Data</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMigration}
                              onClick={() => setSingleTruncateModal({ open: true, table: tbl })}
                              className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold gap-1 cursor-pointer disabled:opacity-40"
                              title={`Truncate ${tbl.name}`}
                            >
                              <Trash2 size={12} />
                              <span>Truncate</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* ── Grid View ── */
            <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredTables.map((tbl) => {
                const isProtected = excludedTables.includes(tbl.name.toLowerCase());
                const isMigration = tbl.name.toLowerCase() === "migrations";
                const isSelected = selectedTables.includes(tbl.name);

                return (
                  <Card
                    key={tbl.name}
                    onClick={() => handleOpenInspector(tbl.name)}
                    className={`border transition-all cursor-pointer ${
                      inspectTable === tbl.name
                        ? "border-[#111A62] ring-2 ring-[#111A62]/20 bg-blue-50/30"
                        : isSelected
                        ? "border-blue-400 bg-blue-50/20"
                        : isProtected
                        ? "border-emerald-200 bg-emerald-50/10 hover:border-emerald-300"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isMigration}
                              onChange={() => handleToggleSelectTable(tbl.name)}
                              className="rounded border-slate-300 text-[#111A62] focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer disabled:opacity-30"
                            />
                            <Badge tone={CATEGORY_TONE[tbl.category] || "default"} className="text-[9px] capitalize">
                              {tbl.category.replace("_", " ")}
                            </Badge>
                          </div>

                          <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isProtected}
                              disabled={isMigration}
                              onChange={() => toggleExcludeTable(tbl.name)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3 cursor-pointer disabled:opacity-50"
                            />
                            <span>Protect</span>
                          </label>
                        </div>

                        <h4 className="font-mono text-sm font-extrabold text-[#111A62] mt-2 truncate" title={tbl.name}>
                          {tbl.name}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Rows</p>
                          <p className="font-mono font-extrabold text-slate-800 mt-0.5">
                            {tbl.rows.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Size</p>
                          <p className="font-mono font-extrabold text-slate-800 mt-0.5 truncate">
                            {tbl.size_human}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenInspector(tbl.name)}
                          className="h-7 px-2 text-xs text-[#111A62] hover:bg-blue-50 font-bold gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isMigration}
                          onClick={() => setSingleTruncateModal({ open: true, table: tbl })}
                          className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 font-bold gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 size={12} /> Truncate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL: Live Table Data Inspector ───────────────────────── */}
      {inspectTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-fade-in">
          <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 animate-scale-up overflow-hidden">
            {/* Inspector Header */}
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-[#111A62]">
                  <TableProperties size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#111A62] font-mono">
                      {inspectTable}
                    </h3>
                    <Badge tone="info" className="text-[10px] uppercase font-mono">
                      {tableData?.total_rows ?? 0} Records
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live database records explorer • Primary Key:{" "}
                    <code className="font-bold text-slate-800">{tableData?.primary_key || "id"}</code>
                  </p>
                </div>
              </div>

              {/* Controls in Inspector Header */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadTableData(inspectTable, tableDataPage)}
                  disabled={tableDataLoading}
                  className="bg-white text-slate-700 h-8 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} className={tableDataLoading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </Button>

                {inspectTable.toLowerCase() !== "migrations" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentTbl = dbData?.tables?.find((t) => t.name === inspectTable) || { name: inspectTable, rows: tableData?.total_rows || 0 };
                      setSingleTruncateModal({ open: true, table: currentTbl });
                    }}
                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 h-8 text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Truncate Table</span>
                  </Button>
                )}

                <button
                  onClick={() => setInspectTable(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition shadow-2xs"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Inspector Search & Sub-header */}
            <div className="shrink-0 bg-white px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <form onSubmit={handleTableDataSearchSubmit} className="w-full sm:w-72 flex items-center gap-2">
                <SearchBar
                  value={tableDataSearch}
                  onChange={setTableDataSearch}
                  placeholder={`Search inside ${inspectTable}...`}
                  className="h-8 text-xs"
                />
                <Button size="sm" type="submit" className="h-8 px-3 text-xs font-bold bg-[#111A62] text-white">
                  Filter
                </Button>
              </form>

              {/* Column Types Pills */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full text-[11px] text-slate-500 py-1">
                <span className="font-bold text-slate-400 mr-1 shrink-0">Columns ({tableData?.columns?.length || 0}):</span>
                {tableData?.columns?.slice(0, 8).map((col) => (
                  <span key={col.name} className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 whitespace-nowrap shrink-0">
                    {col.name} <span className="text-[9px] text-slate-400">({col.type})</span>
                  </span>
                ))}
                {(tableData?.columns?.length || 0) > 8 && (
                  <span className="text-slate-400 text-xs shrink-0">+{(tableData?.columns?.length || 0) - 8} more</span>
                )}
              </div>
            </div>

            {/* Inspector Data Grid */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50/40 min-h-[300px]">
              {tableDataLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
                  <RefreshCw size={28} className="animate-spin text-[#111A62]" />
                  <p className="text-xs font-semibold">Fetching records from `{inspectTable}`...</p>
                </div>
              ) : tableDataError ? (
                <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-200">
                  <AlertTriangle size={24} className="mx-auto mb-2" />
                  <p className="text-sm font-bold">{tableDataError}</p>
                </div>
              ) : !tableData?.rows || tableData.rows.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <Database size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">Table is empty (0 records)</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {tableDataSearch ? "No rows matched your search filter." : `Table \`${inspectTable}\` has no records.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <Table>
                    <TableHeader className="bg-slate-50/90">
                      <TableRow>
                        {tableData.columns.map((col) => (
                          <TableHead
                            key={col.name}
                            onClick={() => handleTableDataSort(col.name)}
                            className="cursor-pointer hover:bg-slate-100 transition whitespace-nowrap text-xs font-bold text-slate-700"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono">{col.name}</span>
                              <ArrowUpDown size={11} className="text-slate-400" />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.rows.map((row, rIdx) => (
                        <TableRow key={row[tableData.primary_key] || rIdx} className="hover:bg-slate-50/70 font-mono text-xs">
                          {tableData.columns.map((col) => {
                            const val = row[col.name];
                            let rendered = val;

                            if (val === null || val === undefined) {
                              rendered = <span className="text-slate-300 italic">NULL</span>;
                            } else if (typeof val === "boolean" || val === 1 || val === 0) {
                              if (col.type === "tinyint" && (val === 1 || val === 0)) {
                                rendered = (
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${val === 1 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                                    {val === 1 ? "TRUE" : "FALSE"}
                                  </span>
                                );
                              }
                            } else if (typeof val === "object") {
                              rendered = (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">
                                  <Code2 size={10} /> JSON
                                </span>
                              );
                            } else if (typeof val === "string" && val.length > 50) {
                              rendered = <span title={val}>{val.substring(0, 48)}...</span>;
                            }

                            return (
                              <TableCell key={col.name} className="whitespace-nowrap max-w-[240px] truncate text-slate-800">
                                {rendered}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Inspector Footer & Pagination */}
            <div className="shrink-0 bg-white px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-mono">
                Showing page <strong className="text-slate-800">{tableData?.current_page || 1}</strong> of{" "}
                <strong className="text-slate-800">{tableData?.last_page || 1}</strong> ({tableData?.total_rows || 0} total records)
              </div>

              {tableData && tableData.last_page > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={tableData.current_page <= 1 || tableDataLoading}
                    onClick={() => loadTableData(inspectTable, tableData.current_page - 1)}
                    className="h-8 px-2.5 text-xs font-bold gap-1 bg-white cursor-pointer"
                  >
                    <ChevronLeft size={13} /> Prev
                  </Button>

                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg">
                    {tableData.current_page}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={tableData.current_page >= tableData.last_page || tableDataLoading}
                    onClick={() => loadTableData(inspectTable, tableData.current_page + 1)}
                    className="h-8 px-2.5 text-xs font-bold gap-1 bg-white cursor-pointer"
                  >
                    Next <ChevronRight size={13} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Single Table Truncate Confirmation ──────────────── */}
      {singleTruncateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 rounded-2xl bg-red-50">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Truncate Table</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {singleTruncateModal.table?.name}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to completely wipe all{" "}
              <strong className="text-red-600 font-mono">
                {singleTruncateModal.table?.rows?.toLocaleString() || 0} records
              </strong>{" "}
              from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">{singleTruncateModal.table?.name}</code>?
            </p>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle size={13} /> Foreign Key Safe & Auto-Increment Reset
              </p>
              <p className="text-[11px] text-amber-700">
                Foreign key constraints will be safely disabled during execution, sequence IDs will restart at 1, and application caches will be flushed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSingleTruncateModal({ open: false, table: null })}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleExecuteSingleTruncate}
                className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
              >
                Yes, Truncate Table
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Bulk Truncate Selected Tables Confirmation ──────── */}
      {bulkTruncateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-red-200 animate-scale-up space-y-5">
            <div className="flex items-start gap-3 text-red-600">
              <div className="p-3 rounded-2xl bg-red-100 text-red-700">
                <Trash2 size={26} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Bulk Delete {bulkTruncateModal.tables.length} Selected Tables
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Truncates the checked tables and restarts their primary ID sequences from 1.
                </p>
              </div>
              <button
                onClick={() => setBulkTruncateModal({ open: false, tables: [] })}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-2xl bg-red-50 border border-red-200 p-3 space-y-1.5">
              <p className="text-xs font-bold text-red-900">Tables to be truncated ({bulkTruncateModal.tables.length}):</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto font-mono text-xs text-red-800">
                {bulkTruncateModal.tables.map((t) => (
                  <span key={t} className="bg-white border border-red-200 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                To confirm truncation of these {bulkTruncateModal.tables.length} tables, type{" "}
                <span className="font-mono font-black text-red-600">DELETE</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkTruncateModal({ open: false, tables: [] });
                  setConfirmInput("");
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={confirmInput.trim().toUpperCase() !== "DELETE"}
                onClick={handleExecuteBulkTruncate}
                className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-40"
              >
                Execute Bulk Truncate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Everything Except... ──────────────────────── */}
      {purgeExceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-red-200 animate-scale-up space-y-5">
            <div className="flex items-start gap-3 text-red-600">
              <div className="p-3 rounded-2xl bg-red-100 text-red-700">
                <ShieldAlert size={26} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Delete Everything Except Specified Tables
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bulk wipe non-excluded tables with zero residue and auto-increment ID resets.
                </p>
              </div>
              <button
                onClick={() => setPurgeExceptModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Fast Presets within Modal */}
            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-600">Quick Protect Presets:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTableNames = (dbData?.tables || []).map((t) => t.name.toLowerCase());
                    setExcludedTables(allTableNames);
                  }}
                  className="text-blue-600 hover:underline cursor-pointer font-bold"
                >
                  Protect All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setExcludedTables(["users", "departments", "permissions", "custom_roles", "role_permissions", "migrations"])}
                  className="text-emerald-600 hover:underline cursor-pointer font-bold"
                >
                  Keep Core Auth Only
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setExcludedTables(["migrations"])}
                  className="text-red-600 hover:underline cursor-pointer font-bold"
                >
                  Wipe All (Except Migrations)
                </button>
              </div>
            </div>

            {/* Tables summary breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 space-y-1.5">
                <p className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Kept / Protected ({excludedTables.length})
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-emerald-800">
                  {excludedTables.map((t) => (
                    <div key={t} className="flex items-center justify-between bg-white/80 px-2 py-0.5 rounded">
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => toggleExcludeTable(t)}
                        disabled={t === "migrations"}
                        className="text-emerald-600 hover:text-emerald-900 disabled:opacity-0 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-red-50 border border-red-200 p-3 space-y-1.5">
                <p className="font-extrabold text-red-900 flex items-center gap-1.5">
                  <Trash2 size={14} /> To Be Wiped ({tablesToWipeInPurgeExcept.length})
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-red-800">
                  {tablesToWipeInPurgeExcept.map((t) => (
                    <div key={t.name} className="flex items-center justify-between bg-white/80 px-2 py-0.5 rounded">
                      <span className="truncate">{t.name}</span>
                      <span className="text-[10px] text-red-500 font-bold">{t.rows}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                To confirm this bulk purge, please type <span className="font-mono font-black text-red-600">PURGE</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type PURGE to confirm"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setPurgeExceptModal(false);
                  setConfirmInput("");
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={confirmInput.trim().toUpperCase() !== "PURGE"}
                onClick={handleExecutePurgeExcept}
                className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-40"
              >
                Execute Bulk Purge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Preset Purge Confirmation ───────────────────────── */}
      {presetModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-amber-200 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 rounded-2xl bg-amber-50">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {presetModal.presetTitle}
                </h3>
                <p className="text-xs text-slate-500">Preset action</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              This will truncate all tables in the <strong>{presetModal.presetTitle}</strong> preset and reset their ID sequences to 1.
            </p>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
              <p className="font-bold text-slate-700 mb-1.5">Target Tables:</p>
              <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                {presetModal.affectedTables.map((t) => (
                  <span key={t} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setPresetModal({ open: false, presetKey: "", presetTitle: "", affectedTables: [] })}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleExecutePreset}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
              >
                Confirm Purge Preset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Reseed Confirmation ─────────────────────────────── */}
      {reseedModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-[#111A62]">
              <div className="p-3 rounded-2xl bg-blue-50">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Run Seeder</h3>
                <p className="text-xs text-slate-500 font-mono">{reseedModal.seeder}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Execute <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">{reseedModal.seeder}</code> to populate fresh records?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setReseedModal({ open: false, seeder: "", title: "" })}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteReseed}
                className="bg-[#111A62] text-white font-bold cursor-pointer"
              >
                Execute Seeder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Loading Modal */}
      <ActionLoadingModal open={actionLoading} message={actionMessage} />

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState({ open: false, variant: "success", title: "", message: "" })}
      />
    </div>
  );
}
