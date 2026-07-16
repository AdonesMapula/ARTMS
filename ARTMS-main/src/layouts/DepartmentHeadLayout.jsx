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
    { label: "Dashboard", to: "/department-head/dashboard", icon: <FiHome /> },
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
    { label: "Notifications", to: "/department-head/notifications", icon: <FiBell />, badge: "3" },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar brand="Department Head" items={items} />}
      topbar={
        <Topbar
          title="Department Head"
          subtitle="Manpower requests • approvals • notifications"
        />
      }
    />
  );
}

