import Badge from "./Badge";

const STATUS_TONE = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  Draft: "default",
  Open: "info",
  Closed: "default",
  New: "info",
  Screening: "warning",
  Interview: "accent",
  Hired: "success",
};

export default function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || "default";
  return <Badge tone={tone}>{status}</Badge>;
}

