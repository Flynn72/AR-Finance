import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-950/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={clsx(
          "relative w-full rounded-[var(--radius-card)] bg-surface-card shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)]",
          SIZE_CLASSES[size]
        )}
      >
        <div className="flex items-start justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-brand-950">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-brand-700">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded p-1 text-brand-700 hover:bg-neutral-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
