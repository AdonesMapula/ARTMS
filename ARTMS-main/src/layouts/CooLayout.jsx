import DashboardShell from "./DashboardShell";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiGrid, FiClipboard, FiBell, FiBookOpen, FiCheckSquare, FiBriefcase } from "react-icons/fi";

export default function CooLayout() {
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
        {
          label: "Job Postings",
          to: "/coo/job-posting-approvals",
          icon: <FiBriefcase />,
        },
      ],
    },
    
    // SYSTEM Section
    { label: "SYSTEM", type: "label" },
    {
      label: "Notifications",
      to: "/coo/notifications",
      icon: <FiBell />,
    },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar brand="Accel4U" items={items} />}
      topbar={
        <Topbar
          title="CHIEF OPERATING OFFICER"
          subtitle="Approvals — PRF, Job Library &amp; Job Postings"
        />
      }
    />
  );
}
