import { cn } from "../../utils/cn";

const VARIANTS = {
  primary:
    "bg-[var(--artms-primary)] text-white hover:bg-[color-mix(in_oklab,var(--artms-primary),#000_10%)]",
  secondary:
    "bg-[var(--artms-primary-2)] text-white hover:bg-[color-mix(in_oklab,var(--artms-primary-2),#000_10%)]",
  outline:
    "border border-[var(--artms-border)] bg-white text-slate-800 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  danger:
    "bg-red-600 text-white hover:bg-[color-mix(in_oklab,#dc2626,#000_12%)]",
  accent:
    "bg-[var(--artms-accent)] text-white hover:bg-[color-mix(in_oklab,var(--artms-accent),#000_10%)]",
};

const SIZES = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition",
        "focus-visible:ring-2 focus-visible:ring-[var(--artms-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:pointer-events-none disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}

