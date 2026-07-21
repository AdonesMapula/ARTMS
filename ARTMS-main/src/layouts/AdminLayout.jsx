import DashboardShell from "./DashboardShell";
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
  FiTrendingUp,
  FiUser,
  FiSettings,
  FiBell,
  FiFileText,
} from "react-icons/fi";

export default function AdminLayout() {
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
      badge: "6",
    },
    { label: "Job Library", to: "/admin/job-library", icon: <FiBriefcase /> },
    { label: "Job Posting", to: "/admin/job-posting", icon: <FiLayers /> },
    { label: "Applicants", to: "/admin/applicants", icon: <FiUsers />, badge: "14" },
    { label: "AI Resume Screening", to: "/admin/ai-screening", icon: <FiCpu /> },
    
    // INTERVIEW & PIPELINE Section
    { label: "INTERVIEW & PIPELINE", type: "label" },
    { label: "Interviews", to: "/admin/interviews", icon: <FiCalendar /> },
    { label: "Pipeline", to: "/admin/pipeline", icon: <FiTrendingUp /> },

    // MANAGEMENT Section
    { label: "MANAGEMENT", type: "label" },
    { label: "Employees", to: "/admin/employees", icon: <FiUsers /> },
    { label: "Reports", to: "/admin/reports", icon: <FiFileText /> },
    
    // SYSTEM Section
    { label: "SYSTEM", type: "label" },
    { label: "Notifications", to: "/admin/notifications", icon: <FiBell /> },
    { label: "Profile", to: "/admin/profile", icon: <FiUser /> },
    { label: "Settings", to: "/admin/settings", icon: <FiSettings /> },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar brand="Accel4U" items={items} />}
      topbar={
        <Topbar
          title="HR ADMIN"
          subtitle="Recruitment operations • pipeline • analytics"
        />
      }
    />
  );
}

