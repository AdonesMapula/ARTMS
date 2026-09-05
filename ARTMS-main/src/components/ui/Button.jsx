import { cn } from "../../utils/cn";

const VARIANTS = {
  primary:
    "bg-[#111A62] text-white border border-[#111A62] shadow-2xs hover:bg-[#0c144e] cursor-pointer active:scale-[0.99] dark:bg-[#3B4BA0] dark:border-[#4D5DB8] dark:hover:bg-[#4D5DB8]",
  secondary:
    "bg-slate-800 text-white border border-slate-700 shadow-2xs hover:bg-slate-700 cursor-pointer active:scale-[0.99] dark:bg-slate-700 dark:hover:bg-slate-600",
  outline:
    "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer active:scale-[0.99]",
  ghost:
    "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-[0.99]",
  danger:
    "bg-rose-600 text-white border border-rose-700 shadow-2xs hover:bg-rose-700 cursor-pointer active:scale-[0.99]",
  destructive:
    "bg-rose-600 text-white border border-rose-700 shadow-2xs hover:bg-rose-700 cursor-pointer active:scale-[0.99]",
  accent:
    "bg-[#E15B1D] text-white border border-[#c44e19] shadow-2xs hover:bg-[#c44e19] cursor-pointer active:scale-[0.99]",
};

const SIZES = {
  xs: "h-7 px-2.5 text-xs",
  sm: "h-8 px-3 text-xs font-semibold",
  md: "h-9 px-3.5 text-sm font-semibold",
  lg: "h-10 px-4 text-sm font-semibold",
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
        "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-all select-none tracking-tight",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111A62]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B0F2E]",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    />
  );
}

