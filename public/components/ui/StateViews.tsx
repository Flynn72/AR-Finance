import type { ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import Button from "./Button";

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-brand-700">
      <RefreshCw size={22} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-bg text-brand-700">
        {icon ?? <Inbox size={20} />}
      </div>
      <div>
        <p className="text-sm font-medium text-brand-950">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-brand-700">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Gagal memuat data. Silakan coba lagi.",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-critical-bg text-critical-text">
        <AlertCircle size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-950">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-brand-700">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
