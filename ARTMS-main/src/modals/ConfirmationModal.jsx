import React, { useState } from "react";
import { AlertTriangle, Trash2, Info, ShieldAlert, AlertCircle } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

export default function ConfirmationModal({
    open,
    onClose,
    onConfirm,
    title = "Confirm Action",
    description = "Are you sure you want to proceed?",
    message = "This action cannot be undone. Please confirm to proceed.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger", // 'danger' | 'warning' | 'info'
    itemName = "",
}) {
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
            // Let the parent component handle closing to avoid unmounting during transition
        }
    };

    // Variant Configuration
    const variants = {
        danger: {
            borderColor: "border-red-200",
            bgColor: "bg-red-50/80",
            iconBg: "bg-red-500",
            iconShadow: "shadow-red-500/20",
            titleColor: "text-red-950",
            textColor: "text-red-800",
            buttonVariant: "danger", // Assuming your Button component has a 'danger' variant
            Icon: Trash2,
        },
        warning: {
            borderColor: "border-amber-200",
            bgColor: "bg-amber-50/80",
            iconBg: "bg-amber-500",
            iconShadow: "shadow-amber-500/20",
            titleColor: "text-amber-950",
            textColor: "text-amber-800",
            buttonVariant: "primary",
            Icon: AlertTriangle,
        },
        info: {
            borderColor: "border-blue-200",
            bgColor: "bg-blue-50/80",
            iconBg: "bg-[#111A62]", // Your primary brand color
            iconShadow: "shadow-blue-500/20",
            titleColor: "text-[#111A62]",
            textColor: "text-slate-600",
            buttonVariant: "primary",
            Icon: Info,
        },
    };

    const current = variants[variant] || variants.info;
    const IconComponent = current.Icon;

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="max-w-md"
            title={title}
            description={description}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={current.buttonVariant}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmText}
                    </Button>
                </div>
            }
        >
            <div className="space-y-5 py-1">
                {/* Main Context Badge */}
                <div
                    className={`flex items-start gap-3.5 rounded-2xl border p-4 ${current.borderColor} ${current.bgColor}`}
                >
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${current.iconBg} ${current.iconShadow}`}
                    >
                        <IconComponent size={24} />
                    </div>
                    <div className="pt-0.5">
                        <p className={`font-bold text-base ${current.titleColor}`}>
                            {itemName ? itemName : "Important Notice"}
                        </p>
                        <p className={`text-sm mt-0.5 leading-relaxed ${current.textColor}`}>
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}