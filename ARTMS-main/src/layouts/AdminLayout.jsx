import { useEffect } from "react";
import DashboardShell from "./DashboardShell";
import ScrollToTop from "../components/ScrollToTop";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FiBarChart2,
  FiClipboard,
  FiBriefcase,
  FiLayers,
  FiUsers,
  FiCpu,
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiUser,
  FiSettings,
  FiBell,
  FiFileText,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { preloadIdleRoutes } from "../utils/preloadRoute";

const ROLE_LABELS = {
  super_admin:     "Super Admin",
  hr_admin:        "Human Resources Admin",
  coo:             "Chief Operating Officer",
  department_head: "Department Head",
  employee:        "Employee",
};

export default function AdminLayout() {
  const { user } = useAuth();
  const roleLabel = ROLE_LABELS[user?.role] ?? (user?.role?.replace(/_/g, " ") ?? "HR Admin");

  // Preload primary admin routes and API data during idle time
  useEffect(() => {
    preloadIdleRoutes([
      '/admin/applicants',
      '/admin/ai-screening',
      '/admin/job-posting',
      '/admin/interviews',
      '/admin/pipeline',
    ]);
  }, []);

  const items = [
    // OVERVIEW Section
    { label: "OVERVIEW", type: "label" },
    { label: "Dashboard", to: "/admin/dashboard", icon: <FiBarChart2 /> },

    // RECRUITMENT Section
    { label: "RECRUITMENT", type: "label" },
    {
      label: "Manpower Requests",
      to: "/admin/manpower-requests",
      icon: <FiClipboard />,
    },
    { label: "Job Library", to: "/admin/job-library", icon: <FiBriefcase /> },
    { label: "Job Posting", to: "/admin/job-posting", icon: <FiLayers /> },
    { label: "Applicants", to: "/admin/applicants", icon: <FiUsers /> },
    { label: "AI Resume Screening", to: "/admin/ai-screening", icon: <FiCpu /> },
    
    // INTERVIEW & PIPELINE Section
    { label: "INTERVIEW & PIPELINE", type: "label" },
    { label: "Interviews", to: "/admin/interviews", icon: <FiCalendar /> },
    { label: "Pipeline", to: "/admin/pipeline", icon: <FiTrendingUp /> },

    // MANAGEMENT Section
    { label: "MANAGEMENT", type: "label" },
    { label: "Employees", to: "/admin/employees", icon: <FiUsers /> },
    { label: "Attendance", to: "/admin/attendance", icon: <FiClock /> },
    
    // SYSTEM Section
    { label: "SYSTEM", type: "label" },
    { label: "Notifications", to: "/admin/notifications", icon: <FiBell /> },
    { label: "Profile", to: "/admin/profile", icon: <FiUser /> },
    { label: "Settings", to: "/admin/settings", icon: <FiSettings /> },
  ];

  return (
    <>
      <ScrollToTop />
      <DashboardShell
        sidebar={<Sidebar brand="Accel4U" items={items} />}
        topbar={
          <Topbar
            title={roleLabel.toUpperCase()}
            subtitle="Recruitment operations • pipeline • analytics"
          />
        }
      />
    </>
  );
}

