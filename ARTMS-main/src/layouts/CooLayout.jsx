import DashboardShell from "./DashboardShell";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiGrid, FiClipboard, FiBell } from "react-icons/fi";

export default function CooLayout() {
  const items = [
    { label: "Dashboard",      to: "/coo/dashboard",       icon: <FiGrid />,      end: true },
    { label: "PRF Approvals",  to: "/coo/prf-approvals",   icon: <FiClipboard /> },
    { label: "Notifications",  to: "/coo/notifications",   icon: <FiBell /> },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar brand="COO Portal" items={items} />}
      topbar={
        <Topbar
          title="Chief Operating Officer"
          subtitle="Personnel Requisition Form approvals"
        />
      }
    />
  );
}
