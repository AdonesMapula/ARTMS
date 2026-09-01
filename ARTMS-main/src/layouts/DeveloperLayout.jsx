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
  FiDatabase,
  FiCpu,
  FiBell,
  FiUser,
  FiMessageSquare,
  FiTerminal,
  FiLayers
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  developer:   "System Developer",
  super_admin: "Super Admin",
};

export default function DeveloperLayout() {
  const { user } = useAuth();
  const roleLabel = ROLE_LABELS[user?.role] ?? "Developer";

  const items = [
    // OVERVIEW
    { label: "DEVELOPER OVERVIEW", type: "label" },
    { label: "Database Management", to: "/developer/database", icon: <FiDatabase /> },
    { label: "Audit Logs", to: "/developer/audit-logs", icon: <FiActivity /> },
    { label: "API & Permissions Debug", to: "/developer/debug-permissions", icon: <FiCpu /> },

    // SYSTEM ADMINISTRATION
    { label: "SYSTEM ADMINISTRATION", type: "label" },
    {
      label: "Users",
      icon: <FiUsers />,
      children: [
        { label: "Active Users", to: "/developer/users", icon: <FiUsers /> },
        { label: "Archived Users", to: "/developer/archived-users", icon: <FiUsers /> },
      ],
    },
    { label: "Departments", to: "/developer/departments", icon: <FiLayers /> },
    { label: "Roles & Permissions", to: "/developer/roles", icon: <FiShield /> },

    // SYSTEM
    { label: "SYSTEM", type: "label" },
    { label: "Notifications", to: "/developer/notifications", icon: <FiBell /> },
    { label: "Messages", to: "/developer/messages", icon: <FiMessageSquare /> },
    { label: "Profile", to: "/developer/profile", icon: <FiUser /> },
    { label: "System Settings", to: "/developer/settings", icon: <FiSettings /> },
  ];

  return (
    <>
      <ScrollToTop />
      <DashboardShell
        sidebar={<Sidebar brand="ARTMS Dev" items={items} />}
        topbar={
          <Topbar
            title="Developer Portal"
            role={roleLabel}
            avatar={user?.avatar}
            profileTo="/developer/profile"
            settingsTo="/developer/settings"
            notificationsTo="/developer/notifications"
            messagesTo="/developer/messages"
          />
        }
      />
    </>
  );
}
