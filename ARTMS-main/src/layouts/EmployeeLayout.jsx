import DashboardShell from "./DashboardShell";
import ScrollToTop from "../components/ScrollToTop";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { LayoutDashboard, FileCheck, User, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function EmployeeLayout() {
  const { user } = useAuth();

  const items = [
    { label: "OVERVIEW", type: "label" },
    { label: "Dashboard", to: "/employee/dashboard", icon: <LayoutDashboard size={18} /> },
    
    { label: "REQUIREMENTS", type: "label" },
    {
      label: "My Requirements",
      to: "/employee/requirements",
      icon: <FileCheck size={18} />,
    },
    
    { label: "PREFERENCES", type: "label" },
    { label: "Messages", to: "/employee/messages", icon: <MessageSquare size={18} /> },
    { label: "Profile", to: "/employee/profile", icon: <User size={18} /> },
  ];

  return (
    <>
      <ScrollToTop />
      <DashboardShell
        sidebar={<Sidebar brand="ARTMS" items={items} />}
        topbar={
          <Topbar
            title="EMPLOYEE PORTAL"
            subtitle="Manage your requirements, profile, and overview"
          />
        }
      />
    </>
  );
}
