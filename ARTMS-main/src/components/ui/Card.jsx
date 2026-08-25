import { cn } from "../../utils/cn";

export function Card({ className, ...props }) {
  const hasBg = className && /\bbg-/.test(className);
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--artms-border)] shadow-sm dark:border-slate-800",
        !hasBg && "bg-white dark:bg-[#0F163D]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("px-5 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  const hasTextColor = className && /\btext-(?:slate|white|black|navy|orange|indigo|purple|emerald|red|blue|gray|zinc|neutral|stone|teal|amber|rose|cyan|lime|violet|fuchsia|pink|\[.+\])\b/.test(className);
  return (
    <h3 className={cn("text-sm font-extrabold", !hasTextColor && "text-slate-900 dark:text-white", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("mt-1 text-sm text-slate-600 dark:text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}


