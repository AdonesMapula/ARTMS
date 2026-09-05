import { cn } from "../../utils/cn";

export function Card({ className, ...props }) {
  const hasBg = className && /\bbg-/.test(className);
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/80 bg-white shadow-2xs transition-colors dark:border-slate-800 dark:bg-[#0F163D]",
        !hasBg && "bg-white dark:bg-[#0F163D]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  const hasTextColor =
    className &&
    /\btext-(?:slate|white|black|navy|orange|indigo|purple|emerald|red|blue|gray|zinc|neutral|stone|teal|amber|rose|cyan|lime|violet|fuchsia|pink|\[.+\])\b/.test(
      className
    );
  return (
    <h3
      className={cn(
        "text-sm font-bold tracking-tight",
        !hasTextColor && "text-slate-900 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("mt-0.5 text-xs text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center px-5 py-3 border-t border-slate-100 dark:border-slate-800",
        className
      )}
      {...props}
    />
  );
}


