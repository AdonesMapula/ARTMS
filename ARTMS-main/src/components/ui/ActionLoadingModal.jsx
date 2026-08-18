import React, { useEffect } from "react";
import { Loader2, Sparkles, Edit3, Trash2, Save, UploadCloud, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * ActionLoadingModal
 *
 * Full-screen blocking modal overlay during Create, Edit, Delete, or Save operations.
 * - Perfectly consistent with ARTMS Modal and AlertModal design system.
 * - Uses system navy (#111A62), border tokens, backdrop-blur-md, and smooth modalIn transitions.
 */
export default function ActionLoadingModal({
  open = false,
  type = "save",
  title,
  message,
  zIndex = "z-[99999]",
}) {
  useEffect(() => {
    if (!open) return;
    const preventScroll = (e) => e.preventDefault();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  // Configurations based on action type matching ARTMS system theme
  const config = {
    create: {
      defaultTitle: "Creating Entry...",
      defaultMessage: "Please wait while we submit your new entry for review...",
      icon: Sparkles,
      badgeBg: "bg-blue-50/90 text-[#111A62] ring-1 ring-blue-200",
      barColor: "bg-[#111A62]",
      titleColor: "text-slate-900",
    },
    edit: {
      defaultTitle: "Updating Entry...",
      defaultMessage: "Please wait while we update and save your changes...",
      icon: Edit3,
      badgeBg: "bg-indigo-50/90 text-indigo-700 ring-1 ring-indigo-200",
      barColor: "bg-indigo-700",
      titleColor: "text-slate-900",
    },
    delete: {
      defaultTitle: "Deleting Entry...",
      defaultMessage: "Please wait while this entry is being removed...",
      icon: Trash2,
      badgeBg: "bg-red-50 text-red-600 ring-1 ring-red-200",
      barColor: "bg-red-600",
      titleColor: "text-red-900",
    },
    upload: {
      defaultTitle: "Processing Document...",
      defaultMessage: "Please wait while AI analyzes and extracts your document...",
      icon: UploadCloud,
      badgeBg: "bg-blue-50/90 text-[#111A62] ring-1 ring-blue-200",
      barColor: "bg-[#111A62]",
      titleColor: "text-slate-900",
    },
    save: {
      defaultTitle: "Saving Changes...",
      defaultMessage: "Please wait while we process and save your information...",
      icon: Save,
      badgeBg: "bg-blue-50/90 text-[#111A62] ring-1 ring-blue-200",
      barColor: "bg-[#111A62]",
      titleColor: "text-slate-900",
    },
    process: {
      defaultTitle: "Processing Request...",
      defaultMessage: "Please wait while your request is being processed...",
      icon: RefreshCw,
      badgeBg: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
      barColor: "bg-[#111A62]",
      titleColor: "text-slate-900",
    },
  }[type] || {
    defaultTitle: "Processing...",
    defaultMessage: "Please wait a moment while we complete this action...",
    icon: Loader2,
    badgeBg: "bg-blue-50 text-[#111A62] ring-1 ring-blue-200",
    barColor: "bg-[#111A62]",
    titleColor: "text-slate-900",
  };

  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md transition-all duration-200 select-none",
        zIndex
      )}
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle}
      style={{ pointerEvents: "all" }}
    >
      <style>{`
        @keyframes action-bar-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(250%); }
        }
        .action-bar-slide {
          animation: action-bar-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--artms-border)] bg-white p-7 text-center shadow-2xl animate-[modalIn_180ms_ease-out]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Centered System Icon Badge */}
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-xs transition-transform", config.badgeBg)}>
            <IconComponent className={cn("h-6 w-6", type === "process" && "animate-spin")} />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200">
            <Loader2 size={13} className="animate-spin text-[#111A62]" />
          </div>
        </div>

        {/* Title */}
        <h3 className={cn("text-base font-extrabold tracking-tight", config.titleColor)}>
          {displayTitle}
        </h3>

        {/* Message */}
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
          {displayMessage}
        </p>

        {/* Indeterminate Animated Progress Bar */}
        <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={cn("action-bar-slide absolute top-0 bottom-0 w-1/3 rounded-full", config.barColor)} />
        </div>

        {/* Footer Guidance */}
        <p className="mt-3.5 text-[11px] font-medium text-slate-400">
          Please wait • Do not close or refresh
        </p>
      </div>
    </div>
  );
}
