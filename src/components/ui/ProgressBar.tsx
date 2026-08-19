import clsx from "clsx";

interface ProgressBarProps {
  value: number; // 0-100
  tone?: "action" | "success" | "warning" | "critical";
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  action: "bg-action",
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-critical",
};

export default function ProgressBar({ value, tone = "action", className }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  // Utilisasi >100% (over-limit) tetap ditampilkan penuh tapi warnanya critical
  const effectiveTone = value > 100 ? "critical" : tone;

  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-neutral-bg", className)}>
      <div
        className={clsx("h-full rounded-full transition-all", TONE_CLASSES[effectiveTone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
