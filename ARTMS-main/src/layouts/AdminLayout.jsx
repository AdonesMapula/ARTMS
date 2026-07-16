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
    { label: "Dashboard", to: "/admin/dashboard", icon: <FiBarChart2 /> },
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
    { label: "Interviews", to: "/admin/interviews", icon: <FiCalendar /> },
    { label: "Pipeline", to: "/admin/pipeline", icon: <FiTrendingUp /> },
    { label: "Employees", to: "/admin/employees", icon: <FiUsers /> },
    { label: "Reports", to: "/admin/reports", icon: <FiFileText /> },
    { label: "Notifications", to: "/admin/notifications", icon: <FiBell /> },
    { label: "Profile", to: "/admin/profile", icon: <FiUser /> },
    { label: "Settings", to: "/admin/settings", icon: <FiSettings /> },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar brand="HR Admin" items={items} />}
      topbar={
        <Topbar
          title="HR Admin"
          subtitle="Recruitment operations • pipeline • analytics"
        />
      }
    />
  );
}

