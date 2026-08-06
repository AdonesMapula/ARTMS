import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title = "Confirm action",
  description = "Are you sure you want to continue?",
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
  const finalTone = variant === "danger" ? "danger" : (tone === "danger" ? "danger" : "primary");

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={handleClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            {finalCancelText}
          </Button>
          <Button
            type="button"
            variant={finalTone}
            onClick={() => {
              onConfirm?.();
              handleClose();
            }}
          >
            {finalConfirmText}
          </Button>
        </div>
      }
    />
  );
}

