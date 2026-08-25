import { Toaster as Sonner } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="top-center"
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
        info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
        error: <XCircle className="h-5 w-5 text-rose-500 shrink-0" />,
        loading: <Loader2 className="h-5 w-5 text-[#111A62] dark:text-indigo-400 animate-spin shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl dark:group-[.toaster]:bg-[#0F163D] dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800 dark:group-[.toaster]:shadow-2xl font-sans text-sm py-3.5 px-4 gap-3",
          title:
            "font-bold text-slate-900 dark:text-white text-sm leading-snug",
          description:
            "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400 text-xs font-medium mt-0.5 leading-relaxed",
          actionButton:
            "group-[.toast]:bg-[#111A62] group-[.toast]:text-white dark:group-[.toast]:bg-[#F97316] dark:group-[.toast]:text-white font-semibold rounded-xl text-xs px-3 py-1.5 shadow-sm hover:opacity-90 transition",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-300 font-semibold rounded-xl text-xs px-3 py-1.5",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:text-slate-400 hover:group-[.toast]:text-slate-600 dark:group-[.toast]:bg-[#0F163D] dark:group-[.toast]:text-slate-400 dark:hover:group-[.toast]:text-slate-200 group-[.toast]:border-slate-200 dark:group-[.toast]:border-slate-800",
          success:
            "group-[.toaster]:border-emerald-500/40 dark:group-[.toaster]:border-emerald-500/40",
          error:
            "group-[.toaster]:border-rose-500/40 dark:group-[.toaster]:border-rose-500/40",
          warning:
            "group-[.toaster]:border-amber-500/40 dark:group-[.toaster]:border-amber-500/40",
          info:
            "group-[.toaster]:border-blue-500/40 dark:group-[.toaster]:border-blue-500/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
