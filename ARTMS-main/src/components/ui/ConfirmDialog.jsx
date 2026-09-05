import { FiAlertTriangle, FiInfo } from "react-icons/fi";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title = "Confirm Action",
  description = "Are you sure you want to continue?",
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onClose,
  confirmText,
  cancelText,
  variant,
  onCancel,
}) {
  const handleClose = onClose || onCancel || (() => {});
  const finalConfirmText = confirmText || confirmLabel || "Confirm";
  const finalCancelText = cancelText || cancelLabel || "Cancel";
  const finalTone = variant === "danger" || tone === "danger" ? "danger" : "primary";

  const isDanger = finalTone === "danger";
  const Icon = isDanger ? FiAlertTriangle : FiInfo;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="max-w-[420px]"
    >
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        {/* Architectural Icon Container */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg mb-4 border transition-transform duration-200 ${
            isDanger
              ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
              : "bg-blue-50 text-[#111A62] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900"
          }`}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
          {title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-2 leading-relaxed">
          {description}
        </p>

        {/* Optional Details Box */}
        {details && (
          <div className="w-full mt-2 mb-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-400 text-left font-mono overflow-y-auto max-h-32">
            {details}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            className="flex-1 font-semibold"
            onClick={handleClose}
          >
            {finalCancelText}
          </Button>
          <Button
            type="button"
            variant={finalTone}
            className="flex-1 font-semibold"
            onClick={() => {
              onConfirm?.();
              handleClose();
            }}
          >
            {finalConfirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

