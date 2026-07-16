import { useEffect, useState } from "react";
import { FiActivity, FiShield, FiUsers } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Skeleton from "../../components/ui/Skeleton";
import dashboardService from "../../services/dashboardService";

export default function SuperAdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    dashboardService.getSuperAdminStats()
      .then(r => setStats(r.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
  if (error) return <p className="p-6 text-red-500 text-sm">{error}</p>;

  const usersByRole = stats.users_by_role ?? [];
  const auditLogs   = stats.recent_audit_logs ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Governance</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Live user and system overview.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat title="Total Users"    value={stats.total_users}   icon={<FiUsers />} />
        <Stat title="Active Users"   value={stats.active_users}  icon={<FiShield />} />
        <Stat title="Departments"    value={stats.departments?.length ?? 0} icon={<FiActivity />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Users by role */}
        <Card>
          <CardHeader><CardTitle>Users by Role</CardTitle></CardHeader>
          <CardContent>
            {usersByRole.length === 0
              ? <p className="text-sm text-slate-400">No data yet.</p>
              : (
                <div className="space-y-2">
                  {usersByRole.map(r => (
                    <div key={r.role} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2">
                      <Badge tone="info">{r.role.replace(/_/g, " ")}</Badge>
                      <span className="font-extrabold text-slate-900">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader><CardTitle>Departments</CardTitle></CardHeader>
          <CardContent>
            {(stats.departments ?? []).length === 0
              ? <p className="text-sm text-slate-400">No departments yet.</p>
              : (
                <div className="space-y-2">
                  {(stats.departments ?? []).map(d => (
                    <div key={d.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2">
                      <span className="text-sm font-semibold text-slate-800">{d.department_name}</span>
                      <Badge tone={d.is_active ? "success" : "default"}>
                        {d.employees_count} staff
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Recent audit logs */}
      <Card>
        <CardHeader><CardTitle>Recent Audit Events</CardTitle></CardHeader>
        <CardContent>
          {auditLogs.length === 0
            ? <p className="text-sm text-slate-400">No audit events yet.</p>
            : (
              <Table>
                <THead>
                  <tr>
                    <TH>User</TH>
                    <TH>Action</TH>
                    <TH>Module</TH>
                    <TH>IP</TH>
                    <TH className="text-right">Time</TH>
                  </tr>
                </THead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <TD className="font-semibold text-slate-900">{log.user?.email ?? "System"}</TD>
                      <TD><Badge tone="info">{log.action}</Badge></TD>
                      <TD className="capitalize">{log.module}</TD>
                      <TD className="text-slate-400 text-xs">{log.ip_address}</TD>
                      <TD className="text-right text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{value ?? 0}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-[var(--artms-primary)]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
