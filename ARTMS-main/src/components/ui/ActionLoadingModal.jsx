import React, { useEffect } from "react";
import { Loader2, Sparkles, User, Building2, Save, UploadCloud, RefreshCw, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

/**
 * ActionLoadingModal
 *
 * Full-screen blocking modal overlay during Document Upload, Create, Edit, or Save operations.
 * - Premium UI/UX with glowing animations, glassmorphism, and dynamic icons.
 * - Non-cancellable blocking state so users cannot click away.
 * - Smooth Framer Motion enter and exit transitions.
 */
export default function ActionLoadingModal({
  open = false,
  type = "upload",
  title,
  message,
  zIndex = "z-[99999]",
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [open]);

  const config = {
    upload: {
      defaultTitle: "Processing Document",
      defaultMessage: "Please wait while we securely upload and process your files...",
      icon: UploadCloud,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-500/20",
    },
    create: {
      defaultTitle: "Creating Record",
      defaultMessage: "Please wait while we initialize and save the new data...",
      icon: Sparkles,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
    },
    edit: {
      defaultTitle: "Updating Record",
      defaultMessage: "Please wait while we apply and save your changes...",
      icon: Save,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
    },
    save: {
      defaultTitle: "Saving Changes",
      defaultMessage: "Please wait while we securely store your information...",
      icon: Save,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      border: "border-indigo-200 dark:border-indigo-500/20",
    },
    process: {
      defaultTitle: "Processing Request",
      defaultMessage: "Please wait while we execute your request...",
      icon: RefreshCw,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      border: "border-purple-200 dark:border-purple-500/20",
    },
  }[type] || {
    defaultTitle: "Processing",
    defaultMessage: "Please wait a moment...",
    icon: Loader2,
    color: "text-[#111A62] dark:text-indigo-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  };

  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm select-none",
            zIndex
          )}
          role="dialog"
          aria-modal="true"
          aria-label={displayTitle}
          style={{ pointerEvents: "all" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-[340px] overflow-hidden rounded-[24px] border border-white/20 bg-white/90 p-8 text-center shadow-[0_8px_40px_rgb(0,0,0,0.12)] backdrop-blur-xl dark:border-slate-700/50 dark:bg-[#0F163D]/95 dark:shadow-[0_8px_40px_rgb(0,0,0,0.4)]"
            onMouseDown={(e) => e.stopPropagation()}
          >


            {/* Dynamic Icon Container */}
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              {/* Outer pulsing ring */}
              <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", config.bg)} />
              {/* Inner static ring */}
              <div className={cn("absolute inset-1 rounded-full border-2 border-dashed opacity-40 animate-[spin_4s_linear_infinite]", config.border)} />
              {/* Center icon bubble */}
              <div className={cn("relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-500", config.bg, config.border, "border")}>
                <IconComponent className={cn("h-6 w-6", config.color, type === "process" && "animate-spin")} />
              </div>
              {/* Small loading spinner badge */}
              <div className="absolute -bottom-1 -right-1 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                <Loader2 size={14} className={cn("animate-spin", config.color)} />
              </div>
            </div>

            {/* Text Content */}
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {displayTitle}
            </h3>
            
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {displayMessage}
            </p>

            {/* Progress Indication */}
            <div className="mt-6 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 dark:bg-slate-600" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 dark:bg-slate-600" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 dark:bg-slate-600" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { ActionLoadingModal };
