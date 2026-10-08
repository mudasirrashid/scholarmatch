import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "positive" | "caution" | "accent";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-hairline bg-white/[0.04] text-mist-300",
  positive: "border-mint-400/25 bg-mint-400/10 text-mint-300",
  caution: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  accent: "border-azure-400/25 bg-azure-400/10 text-azure-300",
};

/** Compact metadata chip used for funding, degree and status labels. */
export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[0.6875rem] leading-none font-medium tracking-[0.02em]",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Section-level eyebrow: a mono micro-label preceded by a short rule. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "label-micro flex items-center gap-3 text-azure-300/90",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-px w-8 bg-gradient-to-r from-azure-400/70 to-transparent"
      />
      {children}
    </p>
  );
}