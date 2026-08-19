import { useEffect, useMemo, useState } from "react";
import { ClipboardList, HandCoins, CalendarClock, Plus } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import KPICard from "../components/ui/KPICard";
import FilterBar from "../components/ui/FilterBar";
import Button from "../components/ui/Button";
import { LoadingState, ErrorState } from "../components/ui/StateViews";
import CollectionHistoryList from "../components/collection/CollectionHistoryList";
import { useARStore } from "../store/useARStore";
import { useUIStore } from "../store/useUIStore";
import { getCollectionKPIs, getFollowUpList } from "../lib/collectionSelectors";
import { formatCurrencyCompact, formatDate } from "../lib/format";
import clsx from "clsx";

type ViewFilter = "all" | "follow_up" | "ptp";

export default function Collection() {
  const { status, error, init, customers, activities } = useARStore();
  const openLogActivity = useUIStore((s) => s.openLogActivity);
  const [view, setView] = useState<ViewFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    init();
  }, [init]);

  const customerNameByCode = useMemo(
    () => new Map(customers.map((c) => [c.customer_code, c.customer_name])),
    [customers]
  );

  const kpis = useMemo(() => getCollectionKPIs(activities), [activities]);
  const followUpList = useMemo(() => getFollowUpList(activities), [activities]);

  const filteredActivities = useMemo(() => {
    let result = [...activities].sort((a, b) => b.activity_date.localeCompare(a.activity_date));
    if (view === "follow_up") result = result.filter((a) => !!a.next_follow_up);
    if (view === "ptp") result = result.filter((a) => a.is_ptp);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => {
        const name = customerNameByCode.get(a.customer_code)?.toLowerCase() ?? "";
        return a.invoice_number.toLowerCase().includes(q) || name.includes(q);
      });
    }
    return result;
  }, [activities, view, search, customerNameByCode]);

  return (
    <AppLayout
      title="Collection & Activity"
      description="Log aktivitas penagihan, follow up, dan promise to pay."
      actions={
        <Button
          variant="primary"
          icon={<Plus size={14} />}
          onClick={() => openLogActivity()}
        >
          Catat Aktivitas
        </Button>
      }
    >
      {status === "loading" || status === "idle" ? (
        <LoadingState label="Memuat data aktivitas..." />
      ) : status === "error" ? (
        <ErrorState description={error ?? undefined} onRetry={init} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              label="Aktivitas Bulan Ini"
              value={String(kpis.totalThisMonth)}
              icon={<ClipboardList size={18} />}
            />
            <KPICard
              label="Follow Up Perlu Tindakan"
              value={String(kpis.followUpDueCount)}
              icon={<CalendarClock size={18} />}
            />
            <KPICard
              label="Promise to Pay Aktif"
              value={String(kpis.activePtpCount)}
              icon={<HandCoins size={18} />}
            />
            <KPICard
              label="Nilai PTP Aktif"
              value={formatCurrencyCompact(kpis.activePtpValue)}
              icon={<HandCoins size={18} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-4 xl:col-span-2">
              <FilterBar
                chips={[
                  { label: "Semua Aktivitas", value: "all", count: activities.length },
                  {
                    label: "Follow Up",
                    value: "follow_up",
                    count: activities.filter((a) => !!a.next_follow_up).length,
                  },
                  {
                    label: "Promise to Pay",
                    value: "ptp",
                    count: activities.filter((a) => a.is_ptp).length,
                  },
                ]}
                activeChip={view}
                onChipChange={(v) => setView(v as ViewFilter)}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Cari invoice atau customer..."
              />
              <div className="mt-4 max-h-[560px] overflow-y-auto scrollbar-thin pr-1">
                <CollectionHistoryList
                  activities={filteredActivities}
                  showContext
                  customerNameByCode={customerNameByCode}
                  emptyDescription="Belum ada aktivitas yang cocok dengan filter ini."
                />
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-4">
              <h3 className="text-sm font-semibold text-brand-950">Follow Up Terdekat</h3>
              <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {followUpList.length === 0 && (
                  <p className="py-6 text-center text-sm text-brand-700">
                    Tidak ada jadwal follow up.
                  </p>
                )}
                {followUpList.map(({ activity, isOverdue }) => (
                  <div
                    key={activity.activity_id}
                    className={clsx(
                      "rounded-[var(--radius-control)] border px-3 py-2.5 text-sm",
                      isOverdue ? "border-critical/40 bg-critical-bg" : "border-border-subtle"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-brand-950">
                        {customerNameByCode.get(activity.customer_code) ?? activity.customer_code}
                      </p>
                      <span
                        className={clsx(
                          "text-xs font-medium",
                          isOverdue ? "text-critical-text" : "text-brand-700"
                        )}
                      >
                        {formatDate(activity.next_follow_up as string)}
                      </span>
                    </div>
                    <p className="font-data text-xs text-brand-700">{activity.invoice_number}</p>
                    {isOverdue && (
                      <p className="mt-1 text-xs font-medium text-critical-text">
                        Sudah lewat jadwal
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
