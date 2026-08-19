import clsx from "clsx";
import type { AgingBucket, InvoiceStatus, DisputeStatus, RiskLevel } from "../../types";

function BasePill({
  children,
  className,
}: {
  children: string;
  className: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  Paid: "bg-success-bg text-success-text",
  Unpaid: "bg-neutral-bg text-neutral-text",
  Overdue: "bg-warning-bg text-warning-text",
  Disputed: "bg-info-bg text-info-text",
  Escalated: "bg-critical-bg text-critical-text",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const label: Record<InvoiceStatus, string> = {
    Paid: "Lunas",
    Unpaid: "Belum Jatuh Tempo",
    Overdue: "Overdue",
    Disputed: "Disengketa",
    Escalated: "Eskalasi",
  };
  return <BasePill className={STATUS_STYLE[status]}>{label[status]}</BasePill>;
}

const AGING_STYLE: Record<AgingBucket, string> = {
  Current: "bg-success-bg text-success-text",
  "1-30": "bg-warning-bg text-warning-text",
  "31-60": "bg-warning-bg text-warning-text",
  "61-90": "bg-critical-bg text-critical-text",
  ">90": "bg-critical-bg text-critical-text",
};

export function AgingBadge({ bucket }: { bucket: AgingBucket }) {
  const label: Record<AgingBucket, string> = {
    Current: "Current",
    "1-30": "1–30 Hari",
    "31-60": "31–60 Hari",
    "61-90": "61–90 Hari",
    ">90": ">90 Hari",
  };
  return <BasePill className={AGING_STYLE[bucket]}>{label[bucket]}</BasePill>;
}

const DISPUTE_STYLE: Record<DisputeStatus, string> = {
  Open: "bg-info-bg text-info-text",
  "Under Review": "bg-warning-bg text-warning-text",
  "Waiting Customer": "bg-neutral-bg text-neutral-text",
  Resolved: "bg-success-bg text-success-text",
  Rejected: "bg-critical-bg text-critical-text",
};

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  return <BasePill className={DISPUTE_STYLE[status]}>{status}</BasePill>;
}

const RISK_STYLE: Record<RiskLevel, string> = {
  Low: "bg-success-bg text-success-text",
  Medium: "bg-warning-bg text-warning-text",
  High: "bg-critical-bg text-critical-text",
  Critical: "bg-critical text-white",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  Low: "Risiko Rendah",
  Medium: "Risiko Sedang",
  High: "Risiko Tinggi",
  Critical: "Risiko Kritis",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <BasePill className={RISK_STYLE[level]}>{RISK_LABEL[level]}</BasePill>;
}
