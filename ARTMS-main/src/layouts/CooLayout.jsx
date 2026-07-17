import DashboardShell from "./DashboardShell";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiGrid, FiClipboard, FiBell, FiBookOpen, FiCheckSquare, FiBriefcase } from "react-icons/fi";

export default function CooLayout() {
  const items = [
    {
      label: "Dashboard",
      to: "/coo/dashboard",
      icon: <FiGrid />,
      end: true,
    },
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
    {
      label: "Notifications",
      to: "/coo/notifications",
      icon: <FiBell />,
    },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar brand="COO Portal" items={items} />}
      topbar={
        <Topbar
          title="Chief Operating Officer"
          subtitle="Approvals — PRF, Job Library &amp; Job Postings"
        />
      }
    />
  );
}
