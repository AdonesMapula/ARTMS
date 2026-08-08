import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn";

export default function Input({ className, label, hint, error, type = "text", icon, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
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
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          className={cn(
            "h-11 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 text-sm text-slate-900 transition-colors",
            "placeholder:text-slate-400",
            "focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]",
            icon && "pl-10",
            isPassword && "pr-10",
            error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

