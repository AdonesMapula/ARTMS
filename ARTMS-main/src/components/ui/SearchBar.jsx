import { useState, useRef, useEffect } from "react";
import { Search, X, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

export default function SearchBar({
  value = "",
  onChange,
  onSelectSuggestion,
  suggestions = [],
  placeholder = "Search…",
  className,
  inputClassName,
  icon: CustomIcon,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter recommendations based on current search value
  const filteredSuggestions = suggestions.filter((s) => {
    const label = typeof s === "string" ? s : s.label || s.title || s.name || "";
    if (!value || value.trim() === "") return true;
    return label.toLowerCase().includes(value.toLowerCase());
  });

  const handleSelect = (item) => {
    const label = typeof item === "string" ? item : item.label || item.title || item.name || item.id || "";
    onChange?.(label);
    onSelectSuggestion?.(item);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full group">
      {/* Gradient Glow Background Ring (Smooth Delay Appear) */}
      <div className="absolute -inset-[1.5px] rounded-lg bg-gradient-to-r from-[#111A62] to-[#E15B1D] opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none z-0" />
      <div className="absolute -inset-[1.5px] rounded-lg bg-gradient-to-r from-[#111A62] to-[#E15B1D] opacity-0 group-focus-within:opacity-30 blur-sm transition-opacity duration-300 pointer-events-none z-0" />

      {/* ShadCN Input-Group Style */}
      <div
        className={cn(
          "relative z-10 flex items-center gap-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm group-focus-within:border-transparent outline-none",
          className
        )}
      >
        {CustomIcon ? (
          <CustomIcon className="shrink-0 text-slate-400" size={16} />
        ) : (
          <Search className="shrink-0 text-slate-400" size={16} />
        )}
        <input
          className={cn(
            "flex h-full w-full bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500",
            inputClassName
          )}
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          inputMode="search"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange?.("");
              onSelectSuggestion?.({ id: "all", label: "All Positions" });
            }}
            aria-label="Clear search"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ShadCN Command Dropdown Style with Framer Motion */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full z-[100] mt-1.5 w-full min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-lg shadow-black/5"
          >
            <div className="overflow-hidden p-1.5 text-slate-950">
              <div className="flex flex-col gap-0.5 max-h-[168px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((item, idx) => {
                    const label = typeof item === "string" ? item : item.label || item.title || item.name || "";
                    const isSelected = value.toLowerCase() === label.toLowerCase() || (item.id && value === item.id);
                    const count = item.count != null ? item.count : undefined;

                    return (
                      <button
                        key={typeof item === "string" ? item + idx : item.id || label + idx}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors w-full text-left",
                          isSelected
                            ? "bg-slate-100 text-slate-900 font-medium"
                            : "hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isSelected ? (
                            <Check size={14} className="text-slate-900 shrink-0" />
                          ) : (
                            <div className="w-3.5 shrink-0" />
                          )}
                          <span className="truncate">{label}</span>
                        </div>
                        
                        {count != null && (
                          <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-sm text-slate-500">
                    No results found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
