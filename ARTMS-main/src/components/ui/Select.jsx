import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Premium Custom Select Component
 *
 * Full drop-in replacement for native select elements with custom floating popover,
 * smooth scale-fade transitions, checkmark indicators, and click-outside detection.
 */
export default function Select({
  className,
  label,
  hint,
  error,
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  name,
  id,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const elementId = id || name;

  // Find currently selected option
  const selectedOption = options.find((o) => String(o.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle option click
  const handleSelect = (option) => {
    if (option.disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Simulate standard event object for seamless compatibility with standard form handlers
      onChange({
        target: {
          name: name || id,
          value: option.value,
        },
      });
    }
  };

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label ? (
        <label
          htmlFor={elementId}
          className="mb-1.5 block text-sm font-semibold text-slate-800"
        >
          {label}
        </label>
      ) : null}

      <div className={cn("relative", isOpen ? "z-40" : "z-10")}>
        {/* Trigger Button */}
        <button
          type="button"
          id={elementId}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-2xs transition-all duration-200 outline-none cursor-pointer",
            "hover:border-[#111A62] hover:bg-slate-50/60",
            isOpen ? "border-[#111A62] ring-2 ring-[#111A62]/20 bg-slate-50/50" : "",
            disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : "",
            error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""
          )}
          aria-expanded={isOpen}
          {...props}
        >
          <span
            className={cn(
              "truncate font-medium",
              !selectedOption || selectedOption.value === ""
                ? "text-slate-400 font-normal"
                : "text-slate-900"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-slate-400 transition-transform duration-200 ease-in-out ml-2",
              isOpen ? "rotate-180 text-[#111A62]" : "group-hover:text-[#111A62]"
            )}
          />
        </button>

        {/* Custom Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute left-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 transition-all duration-200 ease-out"
            style={{
              animation: "fadeInScale 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic">No options available</div>
            ) : (
              options.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-150 cursor-pointer text-left font-medium",
                      isSelected
                        ? "bg-[#111A62]/10 text-[#111A62] font-semibold"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900",
                      option.disabled ? "opacity-40 cursor-not-allowed" : ""
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check size={16} className="shrink-0 text-[#111A62] ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
