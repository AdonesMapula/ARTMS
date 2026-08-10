import DashboardShell from "./DashboardShell";
import ScrollToTop from "../components/ScrollToTop";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiGrid, FiClipboard, FiBell, FiBookOpen, FiCheckSquare, FiBriefcase, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  super_admin:     "Super Admin",
  hr_admin:        "HR Admin",
  coo:             "COO",
  department_head: "Department Head",
  employee:        "Employee",
};

export default function CooLayout() {
  const { user } = useAuth();
  const roleLabel = ROLE_LABELS[user?.role] ?? (user?.role?.replace(/_/g, " ") ?? "COO");

  const items = [
    // OVERVIEW Section
    { label: "OVERVIEW", type: "label" },
    {
      label: "Dashboard",
      to: "/coo/dashboard",
      icon: <FiGrid />,
      end: true,
    },
    
    // APPROVALS Section
    { label: "APPROVALS", type: "label" },
    {
      label: "Approvals",
      icon: <FiCheckSquare />,
      children: [
        {
          label: "PRF Approvals",
          to: "/coo/prf-approvals",
          icon: <FiClipboard />,
        },
        {
          label: "Job Library",
          to: "/coo/job-library-approvals",
          icon: <FiBookOpen />,
        },
      ],
    },
    
    // SYSTEM Section
    { label: "SYSTEM", type: "label" },
    {
      label: "History Log",
      to: "/coo/notifications",
      icon: <FiBookOpen />,
    },
    {
      label: "Profile",
      to: "/coo/profile",
      icon: <FiUser />,
    },
  ];

  return (
    <>
      <ScrollToTop />
      <DashboardShell
        sidebar={<Sidebar brand="Accel4U" items={items} />}
        topbar={
          <Topbar
            title={roleLabel.toUpperCase()}
            subtitle="Approvals — PRF, Job Library &amp; Job Postings"
          />
        }
      />
    </>
  );
}
