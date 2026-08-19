import { Phone, Mail, MessageCircle, Users, Bell, CalendarClock } from "lucide-react";
import type { CollectionActivity } from "../../types";
import { formatCurrency, formatDate } from "../../lib/format";
import { EmptyState } from "../ui/StateViews";

const TYPE_ICON: Record<CollectionActivity["activity_type"], typeof Phone> = {
  Telepon: Phone,
  Email: Mail,
  WhatsApp: MessageCircle,
  Meeting: Users,
  "Follow Up": CalendarClock,
  "Payment Reminder": Bell,
};

interface CollectionHistoryListProps {
  activities: CollectionActivity[];
  /** Tampilkan nama customer/invoice di tiap baris — dimatikan saat sudah dalam konteks 1 invoice/customer */
  showContext?: boolean;
  customerNameByCode?: Map<string, string>;
  emptyDescription?: string;
}

export default function CollectionHistoryList({
  activities,
  showContext = false,
  customerNameByCode,
  emptyDescription,
}: CollectionHistoryListProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="Belum ada aktivitas tercatat"
        description={emptyDescription}
        icon={<CalendarClock size={20} />}
      />
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((a) => {
        const Icon = TYPE_ICON[a.activity_type];
        return (
          <div
            key={a.activity_id}
            className="rounded-[var(--radius-control)] border border-border-subtle px-3 py-2.5 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-bg text-brand-700">
                  <Icon size={13} />
                </div>
                <div>
                  <p className="font-medium text-brand-950">
                    {a.activity_type}
                    {showContext && (
                      <span className="ml-2 font-data text-xs font-normal text-brand-700">
                        {a.invoice_number}
                      </span>
                    )}
                  </p>
                  {showContext && customerNameByCode && (
                    <p className="text-xs text-brand-700">
                      {customerNameByCode.get(a.customer_code) ?? a.customer_code}
                    </p>
                  )}
                  <p className="mt-1 text-brand-700">{a.notes}</p>
                  {a.is_ptp && (
                    <p className="mt-1 text-xs font-medium text-warning-text">
                      Promise to Pay: {formatCurrency(a.promise_amount ?? 0)}
                      {a.promise_payment_date && ` pada ${formatDate(a.promise_payment_date)}`}
                    </p>
                  )}
                  {a.next_follow_up && (
                    <p className="mt-0.5 text-xs text-brand-700">
                      Follow up berikutnya: {formatDate(a.next_follow_up)}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-brand-700">
                <p>{formatDate(a.activity_date)}</p>
                <p className="mt-0.5">{a.collector}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
