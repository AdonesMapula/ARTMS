import * as React from "react";
import { cn } from "../../utils/cn";

export function Empty({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyMedia({ variant = "icon", className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center mb-2",
        variant === "icon" &&
          "h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-base font-extrabold tracking-tight text-slate-900 dark:text-white",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function EmptyDescription({ className, children, ...props }) {
  return (
    <p
      className={cn(
        "text-xs font-normal text-slate-500 dark:text-slate-400 leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function EmptyContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Empty;
