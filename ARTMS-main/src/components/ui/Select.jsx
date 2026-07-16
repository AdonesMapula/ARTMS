import { cn } from "../../utils/cn";

export default function Select({
  className,
  label,
  hint,
  error,
  options = [],
  ...props
}) {
  const id = props.id || props.name;
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-slate-800"
        >
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-[var(--artms-border)] bg-white px-3 text-sm text-slate-900",
          "focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]",
          error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

