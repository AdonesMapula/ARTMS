import DashboardShell from "./DashboardShell";
import ScrollToTop from "../components/ScrollToTop";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FiClipboard,
  FiClock,
  FiHome,
  FiBell,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  super_admin:     "Super Admin",
  hr_admin:        "HR Admin",
  coo:             "COO",
  department_head: "Department Head",
  employee:        "Employee",
};

export default function DepartmentHeadLayout() {
  const { user } = useAuth();
  const roleLabel = ROLE_LABELS[user?.role] ?? (user?.role?.replace(/_/g, " ") ?? "Department Head");

  const items = [
    // OVERVIEW Section
    { label: "OVERVIEW", type: "label" },
    { label: "Dashboard", to: "/department-head/dashboard", icon: <FiHome /> },
    
    // REQUESTS Section
    { label: "REQUESTS", type: "label" },
    {
      label: "Manpower Request",
      to: "/department-head/manpower-request",
      icon: <FiClipboard />,
    },
    {
      label: "Request History",
      to: "/department-head/request-history",
      icon: <FiClock />,
    },
    
    // SYSTEM Section
    { label: "SYSTEM", type: "label" },
    { label: "Notifications", to: "/department-head/notifications", icon: <FiBell />, badge: "3" },
  ];

  return (
    <>
      <ScrollToTop />
      <DashboardShell
        sidebar={<Sidebar brand="Accel4U" items={items} />}
        topbar={
          <Topbar
            title={roleLabel.toUpperCase()}
            subtitle="Manpower requests • approvals • notifications"
          />
        }
      />
    </>
  );
}

