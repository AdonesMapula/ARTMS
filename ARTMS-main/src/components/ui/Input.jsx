import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn";

export default function Input({ className, inputClassName, label, hint, error, type = "text", icon, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  const id = props.id || props.name;
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
        >
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          className={cn(
            "h-9 w-full rounded-md border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white shadow-2xs transition-colors",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:border-[#111A62] focus:ring-1 focus:ring-[#111A62] dark:focus:border-indigo-500 dark:focus:ring-indigo-500",
            icon && "pl-9",
            isPassword && "pr-9",
            error ? "border-rose-400 focus:border-rose-600 focus:ring-rose-200" : "",
            inputClassName
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

