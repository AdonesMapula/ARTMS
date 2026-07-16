import { cn } from "../../utils/cn";

export function Table({ className, ...props }) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-separate border-spacing-0" {...props} />
    </div>
  );
}

export function THead({ className, ...props }) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 bg-white text-left text-xs font-bold uppercase tracking-wider text-slate-500",
        className
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }) {
  return (
    <th
      className={cn(
        "border-b border-[var(--artms-border)] px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }) {
  return (
    <td
      className={cn(
        "border-b border-[var(--artms-border)] px-4 py-3 text-sm text-slate-700",
        className
      )}
      {...props}
    />
  );
}

