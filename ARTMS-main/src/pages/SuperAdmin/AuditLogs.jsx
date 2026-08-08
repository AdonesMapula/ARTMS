import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import api from "../../services/api";
import { FiRefreshCw, FiFilter } from "react-icons/fi";

export default function AuditLogs() {
  const [q, setQ] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchLogs = useCallback(async (currentPage = 1, mod = moduleFilter, act = actionFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, per_page: 15 });
      if (mod) params.append("module", mod);
      if (act) params.append("action", act);
      
      const res = await api.get(`/audit-logs?${params.toString()}`);
      
      setLogs(res.data.data || []);
      setTotalPages(res.data.last_page || 1);
      setTotalRecords(res.data.total || 0);
      setPage(res.data.current_page || 1);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, actionFilter]);

  useEffect(() => {
    fetchLogs(page, moduleFilter, actionFilter);
  }, [page, moduleFilter, actionFilter, fetchLogs]);

  const handleModuleChange = (e, val) => {
    setModuleFilter(val);
    setPage(1);
  };

  const handleActionChange = (e, val) => {
    setActionFilter(val);
    setPage(1);
  };

  const filteredLogs = logs.filter((l) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    
    // Safety checks for null values
    const action = l.action || "";
    const module = l.module || "";
    const desc = l.description || "";
    const email = l.user?.email || "";
    const ip = l.ip_address || "";

    return (
      action.toLowerCase().includes(query) ||
      module.toLowerCase().includes(query) ||
      desc.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      ip.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Audit
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Audit Logs
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track administrative actions and system events for compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge tone="info" className="shadow-xs py-1 px-3">Live Database</Badge>
           <Button variant="outline" size="sm" onClick={() => fetchLogs(page)} disabled={loading} className="h-8 w-8 p-0 flex items-center justify-center rounded-lg">
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} />
           </Button>
        </div>
      </div>

      <Card className="shadow-xl border border-slate-200/80 rounded-3xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base font-black text-[#111A62] shrink-0">
              System Events 
              {totalRecords > 0 && <span className="text-slate-400 text-xs font-semibold ml-2">({totalRecords} Total)</span>}
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="w-full sm:w-40">
                <Select
                  name="moduleFilter"
                  value={moduleFilter}
                  onChange={handleModuleChange}
                  options={[
                    { value: "", label: "All Modules" },
                    { value: "user", label: "User" },
                    { value: "job", label: "Job" },
                    { value: "employee", label: "Employee" },
                    { value: "payroll", label: "Payroll" },
                  ]}
                  size="sm"
                  icon={FiFilter}
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  name="actionFilter"
                  value={actionFilter}
                  onChange={handleActionChange}
                  options={[
                    { value: "", label: "All Actions" },
                    { value: "create", label: "Create" },
                    { value: "update", label: "Update" },
                    { value: "delete", label: "Delete" },
                    { value: "login", label: "Login" },
                    { value: "approve", label: "Approve" },
                    { value: "reject", label: "Reject" },
                  ]}
                  size="sm"
                  icon={FiFilter}
                />
              </div>
              <div className="w-full sm:w-56 shrink-0">
                <SearchBar value={q} onChange={setQ} placeholder="Search loaded..." />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <THead className="bg-slate-50/50">
                <tr>
                  <TH className="px-6 py-3">ID</TH>
                  <TH className="px-6 py-3">Actor</TH>
                  <TH className="px-6 py-3">Module</TH>
                  <TH className="px-6 py-3">Action & Details</TH>
                  <TH className="px-6 py-3">IP Address</TH>
                  <TH className="px-6 py-3 text-right">Timestamp</TH>
                </tr>
              </THead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <TD colSpan="6" className="text-center py-12 text-slate-500 font-medium">
                      <FiRefreshCw className="animate-spin inline-block mr-2 text-[var(--artms-primary)]" size={18} /> Loading audit logs...
                    </TD>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                   <tr>
                    <TD colSpan="6" className="text-center py-12 text-slate-500 font-medium">
                      No logs found matching your criteria.
                    </TD>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                      <TD className="px-6 py-3.5 font-bold text-slate-900 text-xs whitespace-nowrap">AL-{l.id}</TD>
                      <TD className="px-6 py-3.5 whitespace-nowrap">
                        {l.user ? (
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-800">{l.user.name}</span>
                             <span className="text-[10px] text-slate-500 mt-0.5 font-medium">{l.user.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs font-semibold">System Generated</span>
                        )}
                      </TD>
                      <TD className="px-6 py-3.5 whitespace-nowrap">
                        <Badge tone="primary" className="uppercase text-[10px] tracking-widest font-black py-0.5 px-2">{l.module}</Badge>
                      </TD>
                      <TD className="px-6 py-3.5 min-w-[250px]">
                         <div className="flex flex-col">
                           <span className="font-extrabold text-slate-800 capitalize text-sm">{l.action.replace(/_/g, ' ')}</span>
                           {l.description && <span className="text-xs text-slate-500 mt-1 leading-relaxed">{l.description}</span>}
                         </div>
                      </TD>
                      <TD className="px-6 py-3.5 text-xs font-mono font-medium text-slate-600 whitespace-nowrap bg-slate-50/50">
                        {l.ip_address || "N/A"}
                      </TD>
                      <TD className="px-6 py-3.5 text-right whitespace-nowrap">
                         <div className="flex flex-col items-end">
                           <span className="text-sm font-bold text-slate-700">{new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                           <span className="text-[11px] font-semibold text-slate-400 mt-0.5 tracking-wide">{new Date(l.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                         </div>
                      </TD>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4">
              <Pagination
                page={page}
                pageSize={15}
                total={totalRecords}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
