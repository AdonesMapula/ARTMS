import DashboardShell from "./DashboardShell";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiActivity, FiSettings, FiShield, FiUsers, FiGrid } from "react-icons/fi";

export default function SuperAdminLayout() {
  const items = [
    { label: "Dashboard", to: "/superadmin/dashboard", icon: <FiGrid /> },
    { label: "Users", to: "/superadmin/users", icon: <FiUsers /> },
    { label: "Departments", to: "/superadmin/departments", icon: <FiUsers /> },
    { label: "Roles & Permissions", to: "/superadmin/roles", icon: <FiShield /> },
    { label: "System Settings", to: "/superadmin/settings", icon: <FiSettings /> },
    { label: "Audit Logs", to: "/superadmin/audit-logs", icon: <FiActivity /> },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar brand="Super Admin" items={items} />}
      topbar={
        <Topbar
          title="Super Admin"
          subtitle="Users • departments • roles • governance"
        />
      }
    />
  );
}

