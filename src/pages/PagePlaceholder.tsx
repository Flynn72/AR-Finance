import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { EmptyState } from "../components/ui/StateViews";

export default function PagePlaceholder({
  phaseLabel,
  icon: Icon = Construction,
}: {
  phaseLabel: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border-subtle bg-surface-card">
      <EmptyState
        icon={<Icon size={20} />}
        title="Modul ini belum dibangun"
        description={`Sesuai roadmap implementasi, halaman ini akan dikerjakan pada ${phaseLabel}.`}
      />
    </div>
  );
}
