"use client";

import type { CSSVars } from "@/lib/css";
import { cn } from "@/lib/cn";
import { useInView } from "@/lib/motion";

/**
 * Horizontal match meter.
 *
 * The fill is a CSS transform driven by a custom property, so the animation
 * runs without per-frame JavaScript. Width is expressed as a percentage so the
 * layout never shifts during the animation.
 */
export function MatchMeter({
  label,
  score,
  /** Stagger offset in milliseconds. */
  delay = 0,
  className,
}: {
  label: string;
  /** Normalised score from 0 to 100. */
  score: number;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const clamped = Math.max(0, Math.min(100, score));
  const isPerfect = clamped >= 100;

  return (
    <div ref={ref} className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-mist-300">{label}</span>
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            isPerfect ? "text-mint-300" : "text-mist-400",
          )}
        >
          {clamped}%
        </span>
      </div>

      <div
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} match`}
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
      >
        <div
          data-meter={inView ? "filled" : "empty"}
          style={
            {
              width: `${clamped}%`,
              "--meter-delay": `${delay}ms`,
            } as CSSVars
          }
          className={cn(
            "h-full rounded-full",
            isPerfect
              ? "bg-gradient-to-r from-mint-400 to-mint-300"
              : "bg-gradient-to-r from-azure-500 to-iris-400",
          )}
        />
      </div>
    </div>
  );
}