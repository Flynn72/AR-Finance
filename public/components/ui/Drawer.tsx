import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Drawer({ open, onClose, title, description, children, footer }: DrawerProps) {
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-brand-950/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full max-w-md flex-col bg-surface-card shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-start justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 id="drawer-title" className="text-base font-semibold text-brand-950">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-brand-700">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded p-1 text-brand-700 hover:bg-neutral-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
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
