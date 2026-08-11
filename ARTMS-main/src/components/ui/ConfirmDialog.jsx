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
        
        {/* Animated Icon Container */}
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full mb-5 transition-transform duration-500 hover:scale-110 ${
          isDanger ? "bg-red-50 text-red-500 border-4 border-red-100/50" : "bg-blue-50 text-[#111A62] border-4 border-blue-100/50"
        }`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-2.5 tracking-tight">
          {title}
        </h3>
        
        <p className="text-sm font-medium text-slate-500 mb-2 px-2 leading-relaxed">
          {description}
        </p>

        {/* Optional Details Box */}
        {details && (
          <div className="w-full mt-3 mb-2 rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 text-xs text-slate-600 text-left font-mono overflow-y-auto max-h-32 custom-scrollbar shadow-inner">
            {details}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full gap-3 mt-6 pt-5 border-t border-slate-100">
          <Button type="button" variant="outline" className="flex-1 py-2.5 font-bold text-slate-600" onClick={handleClose}>
            {finalCancelText}
          </Button>
          <Button
            type="button"
            variant={finalTone}
            className="flex-1 py-2.5 font-bold shadow-sm"
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

