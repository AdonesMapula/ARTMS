export const mockJobs = [
  {
    id: "jr-001",
    title: "Customer Support Associate",
    department: "Operations",
    location: "Cebu City (Hybrid)",
    employmentType: "Full-time",
    level: "Entry",
    postedAt: "2026-07-01",
    tags: ["Voice", "BPO", "Night Shift"],
    summary:
      "Be the front line of customer success—resolve issues, provide product guidance, and create great experiences.",
    responsibilities: [
      "Handle inbound customer inquiries via phone/chat/email",
      "Document interactions and follow support playbooks",
      "Escalate complex cases and follow up on resolutions",
    ],
    qualifications: [
      "Strong communication skills",
      "Basic computer literacy and typing proficiency",
      "Willing to work shifting schedules",
    ],
    preferredSkills: ["CRM familiarity", "Empathy", "Problem-solving"],
  },
  {
    id: "jr-002",
    title: "Talent Acquisition Specialist",
    department: "Human Resources",
    location: "Manila (On-site)",
    employmentType: "Full-time",
    level: "Mid",
    postedAt: "2026-06-26",
    tags: ["Recruitment", "Sourcing", "Interviewing"],
    summary:
      "Own end-to-end recruiting: sourcing, screening, coordination, and stakeholder management with AI-assisted workflows.",
    responsibilities: [
      "Manage requisitions and candidate pipelines",
      "Partner with hiring managers and coordinate interviews",
      "Improve hiring funnels using analytics and feedback",
    ],
    qualifications: [
      "2+ years in recruiting or talent acquisition",
      "Experience with ATS / hiring tools",
      "Strong stakeholder communication",
    ],
    preferredSkills: ["Boolean sourcing", "Employer branding", "Data literacy"],
  },
  {
    id: "jr-003",
    title: "Data Analyst (Recruitment Analytics)",
    department: "People Analytics",
    location: "Remote (PH)",
    employmentType: "Contract",
    level: "Mid",
    postedAt: "2026-06-20",
    tags: ["Analytics", "Dashboards", "SQL (Plus)"],
    summary:
      "Build hiring dashboards and insights across sourcing, screening, interviews, and offer acceptance (UI only for now).",
    responsibilities: [
      "Define hiring KPIs with HR stakeholders",
      "Create dashboards and periodic reports",
      "Translate data into actionable hiring improvements",
    ],
    qualifications: [
      "Strong analytical thinking and reporting skills",
      "Experience with BI tools is a plus",
    ],
    preferredSkills: ["Data storytelling", "KPI design", "Visualization"],
  },
];

export const mockManpowerRequests = [
  {
    id: "MR-2026-0012",
    department: "Operations",
    positionTitle: "Customer Support Associate",
    employmentType: "Full-time",
    vacancies: 15,
    reason: "Expansion",
    priority: "High",
    targetHiringDate: "2026-08-15",
    status: "Pending",
    submittedAt: "2026-07-05",
    approver: "HR Admin",
  },
  {
    id: "MR-2026-0011",
    department: "IT",
    positionTitle: "IT Service Desk Analyst",
    employmentType: "Full-time",
    vacancies: 3,
    reason: "Replacement",
    priority: "Medium",
    targetHiringDate: "2026-08-01",
    status: "Approved",
    submittedAt: "2026-06-28",
    approver: "HR Admin",
  },
  {
    id: "MR-2026-0010",
    department: "Finance",
    positionTitle: "Payroll Specialist",
    employmentType: "Full-time",
    vacancies: 1,
    reason: "New Position",
    priority: "Low",
    targetHiringDate: "2026-09-10",
    status: "Rejected",
    submittedAt: "2026-06-20",
    approver: "HR Admin",
  },
];

export const mockApplicants = [
  {
    id: "APP-1042",
    name: "Alex Rivera",
    role: "Customer Support Associate",
    source: "Landing Page",
    status: "Screening",
    score: 82,
    appliedAt: "2026-07-07",
  },
  {
    id: "APP-1039",
    name: "Sam Santos",
    role: "Talent Acquisition Specialist",
    source: "LinkedIn",
    status: "Interview",
    score: 76,
    appliedAt: "2026-07-06",
  },
  {
    id: "APP-1036",
    name: "Jamie Cruz",
    role: "Data Analyst (Recruitment Analytics)",
    source: "Referral",
    status: "New",
    score: 0,
    appliedAt: "2026-07-05",
  },
];

export const mockNotifications = [
  {
    id: "N-1",
    title: "Manpower request approved",
    message: "MR-2026-0011 was approved and can be converted to a job posting.",
    time: "2h ago",
    tone: "success",
  },
  {
    id: "N-2",
    title: "Interview schedule updated",
    message: "2 interviews were added for tomorrow 10:00 AM–12:00 PM.",
    time: "6h ago",
    tone: "info",
  },
  {
    id: "N-3",
    title: "Manpower request rejected",
    message: "MR-2026-0010 was rejected. Please review remarks and resubmit if needed.",
    time: "2d ago",
    tone: "danger",
  },
];

