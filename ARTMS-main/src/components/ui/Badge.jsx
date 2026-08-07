import { cn } from "../../utils/cn";

const TONES = {
  default: "bg-slate-100 text-slate-700 border border-slate-200/60",
  info: "bg-blue-50 text-blue-700 border border-blue-200/50",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  warning: "bg-amber-50 text-amber-800 border border-amber-200/50",
  danger: "bg-red-50 text-red-700 border border-red-200/50",
  accent: "bg-orange-50 text-orange-700 border border-orange-200/50",
  indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/50",
  navy: "bg-[#111A62]/10 text-[#111A62] border border-[#111A62]/20",
  purple: "bg-purple-50 text-purple-700 border border-purple-200/50",
  emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
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

