import type { ReactNode } from "react";
import { Search, Upload } from "lucide-react";
import Button from "../ui/Button";
import { useUIStore } from "../../store/useUIStore";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function Header({ title, description, actions }: HeaderProps) {
  const openImportWizard = useUIStore((s) => s.openImportWizard);

  return (
    <header className="border-b border-border-subtle bg-white">
      <div className="flex items-center gap-4 px-6 py-3">
        <div className="relative w-full max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700"
          />
          <input
            type="text"
            placeholder="Cari invoice, customer..."
            className="w-full rounded-[var(--radius-control)] border border-border-subtle bg-neutral-bg/50 py-2 pl-8 pr-3 text-sm placeholder:text-brand-700/60 focus:border-action focus:bg-white focus:outline-none focus:ring-1 focus:ring-action"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<Upload size={14} />}
            onClick={openImportWizard}
          >
            Impor Excel
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-brand-950">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-brand-700">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
