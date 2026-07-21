import DashboardShell from "./DashboardShell";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FiClipboard,
  FiClock,
  FiHome,
  FiBell,
} from "react-icons/fi";

export default function DepartmentHeadLayout() {
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
    <DashboardShell
      sidebar={<Sidebar brand="Accel4U" items={items} />}
      topbar={
        <Topbar
          title="DEPARTMENT HEAD"
          subtitle="Manpower requests • approvals • notifications"
        />
      }
    />
  );
}

