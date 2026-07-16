import { cn } from "../../utils/cn";
import Button from "./Button";

export default function EmptyState({
  title = "No data yet",
  description = "Try adjusting filters or check back later.",
  actionLabel,
  onAction,
  icon,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-[var(--artms-border)] bg-white px-6 py-10 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {actionLabel ? (
        <Button className="mt-4" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

