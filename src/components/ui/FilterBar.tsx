import type { ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";

interface FilterChip {
  label: string;
  value: string;
  count?: number;
}

interface FilterBarProps {
  chips?: FilterChip[];
  activeChip?: string;
  onChipChange?: (value: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Slot untuk filter tambahan (dropdown customer, date range, dsb) */
  extra?: ReactNode;
  onOpenAdvancedFilter?: () => void;
}

export default function FilterBar({
  chips,
  activeChip,
  onChipChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  extra,
  onOpenAdvancedFilter,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {onOpenAdvancedFilter && (
        <button
          onClick={onOpenAdvancedFilter}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border-subtle bg-white px-3 py-2 text-sm text-brand-700 hover:bg-neutral-bg"
        >
          <SlidersHorizontal size={14} />
          Filter
        </button>
      )}

      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => onChipChange?.(chip.value)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium transition-colors",
                activeChip === chip.value
                  ? "bg-brand-950 text-white"
                  : "bg-white text-brand-700 border border-border-subtle hover:bg-neutral-bg"
              )}
            >
              {chip.label}
              {typeof chip.count === "number" && (
                <span
                  className={clsx(
                    "font-data text-xs",
                    activeChip === chip.value ? "text-white/70" : "text-brand-700/70"
                  )}
                >
                  {chip.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {extra}

      {onSearchChange && (
        <div className="relative ml-auto min-w-[220px] flex-1 sm:flex-none">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-[var(--radius-control)] border border-border-subtle bg-white py-2 pl-8 pr-3 text-sm placeholder:text-brand-700/60 focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
          />
        </div>
      )}
    </div>
  );
}
