import Badge from "./Badge";
import { cn } from "../../utils/cn";

const STATUS_CONFIG = {
  // ATS Stages
  applied: { label: "Applied", tone: "info" },
  ai_screening: { label: "AI Screening", tone: "warning" },
  under_review: { label: "Under Review", tone: "warning" },
  screening_passed: { label: "Screening Passed", tone: "success" },
  shortlisted: { label: "Shortlisted", tone: "success" },
  ready_for_interview: { label: "Ready for Interview", tone: "indigo" },
  interview_1: { label: "Interview 1", tone: "info" },
  interview_1_scheduled: { label: "Interview 1 Sched.", tone: "info" },
  interview_1_done: { label: "Interview 1 Done", tone: "info" },
  interview_2: { label: "Interview 2", tone: "navy" },
  interview_2_scheduled: { label: "Interview 2 Sched.", tone: "navy" },
  interview_2_done: { label: "Interview 2 Done", tone: "navy" },
  hired: { label: "Hired", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  screening_failed: { label: "Screening Failed", tone: "danger" },

  // General & HR Requests
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  draft: { label: "Draft", tone: "default" },
  open: { label: "Open", tone: "info" },
  closed: { label: "Closed", tone: "default" },
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "default" },
  archived: { label: "Archived", tone: "default" },
};

export default function StatusChip({ status, className }) {
  if (!status) return null;

  const key = String(status).toLowerCase().trim();
  const config = STATUS_CONFIG[key] || {
    label: String(status).replace(/_/g, " "),
    tone: "default",
  };

  return (
    <Badge
      tone={config.tone}
      className={cn("capitalize tracking-normal", className)}
    >
      {config.label}
    </Badge>
  );
}

