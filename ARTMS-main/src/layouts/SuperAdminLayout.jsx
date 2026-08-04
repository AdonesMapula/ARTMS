import DashboardShell from "./DashboardShell";
import ScrollToTop from "../components/ScrollToTop";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FiActivity,
  FiSettings,
  FiShield,
  FiUsers,
  FiGrid,
  FiBarChart2,
  FiClipboard,
  FiBriefcase,
  FiLayers,
  FiCpu,
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiFileText,
  FiBell,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  super_admin:     "Super Admin",
  hr_admin:        "HR Admin",
  coo:             "COO",
  department_head: "Department Head",
  employee:        "Employee",
};

export default function SuperAdminLayout() {
  const { user } = useAuth();
  const roleLabel = ROLE_LABELS[user?.role] ?? (user?.role?.replace(/_/g, " ") ?? "Super Admin");

  const items = [
    // OVERVIEW Section
    { label: "OVERVIEW", type: "label" },
    { label: "Dashboard", to: "/superadmin/dashboard", icon: <FiGrid /> },

    // SYSTEM ADMINISTRATION Section
    { label: "SYSTEM ADMINISTRATION", type: "label" },
    { label: "Users", to: "/superadmin/users", icon: <FiUsers /> },
    { label: "Departments", to: "/superadmin/departments", icon: <FiUsers /> },
    { label: "Roles & Permissions", to: "/superadmin/roles", icon: <FiShield /> },
    { label: "Audit Logs", to: "/superadmin/audit-logs", icon: <FiActivity /> },

    // HR ADMIN ACCESS Section
    { label: "HR ADMIN ACCESS", type: "label" },
    {
      label: "Manpower Requests",
      to: "/superadmin/hr-manpower-requests",
      icon: <FiClipboard />,
    },
    { label: "Job Library", to: "/superadmin/hr-job-library", icon: <FiBriefcase /> },
    { label: "Job Posting", to: "/superadmin/hr-job-posting", icon: <FiLayers /> },
    { label: "Applicants", to: "/superadmin/hr-applicants", icon: <FiUsers /> },
    { label: "AI Resume Screening", to: "/superadmin/hr-ai-screening", icon: <FiCpu /> },
    { label: "Interviews", to: "/superadmin/hr-interviews", icon: <FiCalendar /> },
    { label: "Pipeline", to: "/superadmin/hr-pipeline", icon: <FiTrendingUp /> },
    { label: "Employees", to: "/superadmin/hr-employees", icon: <FiUsers /> },
    { label: "Attendance", to: "/superadmin/hr-attendance", icon: <FiClock /> },

    // SYSTEM Section
    { label: "SYSTEM", type: "label" },
    { label: "Notifications", to: "/superadmin/notifications", icon: <FiBell /> },
    { label: "Profile", to: "/superadmin/profile", icon: <FiUser /> },
    { label: "System Settings", to: "/superadmin/settings", icon: <FiSettings /> },
  ];

  return (
    <>
      <ScrollToTop />
      <DashboardShell
        sidebar={<Sidebar brand="Accel4U" items={items} />}
        topbar={
          <Topbar
            title={roleLabel.toUpperCase()}
            subtitle="System administration • users • departments • HR operations"
          />
        }
      />
    </>
  );
}

