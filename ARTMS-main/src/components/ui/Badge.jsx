import { cn } from "../../utils/cn";

const TONES = {
  default: "bg-slate-100 text-slate-700",
  info: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  accent: "bg-orange-50 text-orange-700",
};

export default function Badge({ tone = "default", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}

