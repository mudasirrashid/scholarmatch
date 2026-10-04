import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Interactive states are expressed as a single resting style plus three
 * pseudo-states rather than as separate variants, so hover/focus/active stay
 * consistent across the whole product.
 */
const BASE =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 " +
  "rounded-full font-medium tracking-[-0.01em] whitespace-nowrap " +
  "transition-[transform,box-shadow,background-color,border-color,color,opacity] " +
  "duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  // Highest-contrast resting state; used for primary conversion actions.
  primary:
    "bg-mist-50 text-ink-950 shadow-[0_1px_0_#fff_inset,0_12px_28px_-14px_rgba(56,189,248,0.55)] " +
    "hover:bg-white hover:shadow-[0_1px_0_#fff_inset,0_18px_40px_-14px_rgba(56,189,248,0.75)]",
  // Glassy secondary for paired actions.
  secondary:
    "surface-glass text-mist-100 hover:border-hairline-strong hover:bg-white/[0.07]",
  // Saturated gradient for deliberate emphasis.
  accent:
    "bg-gradient-to-b from-azure-500 to-iris-600 text-white " +
    "shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_34px_-14px_rgba(79,70,229,0.9)] " +
    "hover:from-azure-400 hover:to-iris-500",
  ghost: "text-mist-300 hover:bg-white/[0.06] hover:text-mist-50",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-[3.25rem] px-7 text-base",
};

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders an anchor when provided, otherwise a `button` element. */
  href?: string;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Accessible label when the visible content is not descriptive. */
  "aria-label"?: string;
  onClick?: () => void;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  type = "button",
  disabled,
  onClick,
  ...rest
}: ButtonProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}