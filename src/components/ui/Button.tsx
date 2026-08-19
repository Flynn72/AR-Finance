import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "critical" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-950 text-white hover:bg-brand-900 border border-brand-950 disabled:opacity-50",
  secondary:
    "bg-white text-brand-950 border border-border-subtle hover:bg-neutral-bg disabled:opacity-50",
  critical:
    "bg-white text-critical border border-critical hover:bg-critical hover:text-white disabled:opacity-50",
  ghost:
    "bg-transparent text-brand-700 hover:bg-neutral-bg border border-transparent disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5",
  md: "text-sm px-3.5 py-2 gap-2",
};

export default function Button({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium transition-colors whitespace-nowrap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-1",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
