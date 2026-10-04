"use client";

import { CountUp } from "@/components/motion/count-up";
import type { CSSVars } from "@/lib/css";
import { cn } from "@/lib/cn";
import { useInView } from "@/lib/motion";

/**
 * Circular match indicator.
 *
 * The arc is a conic gradient whose progress is driven by a registered
 * `@property` custom property, which means the browser interpolates it on the
 * compositor rather than requiring a JavaScript animation loop.
 */
export function MatchRing({
  score,
  size = "md",
  label,
  className,
}: {
  /** Normalised score from 0 to 100. */
  score: number;
  size?: "sm" | "md" | "lg";
  /** Accessible description, e.g. "Overall match". */
  label: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const clamped = Math.max(0, Math.min(100, score));

  const dimensions = {
    sm: { box: "size-16", text: "text-xl", inner: "inset-[3px]" },
    md: { box: "size-24", text: "text-2xl", inner: "inset-[4px]" },
    lg: { box: "size-36", text: "text-4xl", inner: "inset-[5px]" },
  }[size];

  /* A 64px ring cannot hold a number, a percent sign and a tracked-out
     uppercase label without the three of them crowding each other. The
     compact ring therefore shows the bare figure; the accessible name on
     the parent still carries "label: N percent" for assistive tech. */
  const showCaption = size !== "sm";

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${label}: ${clamped} percent`}
      className={cn("relative grid place-items-center", dimensions.box, className)}
    >
      <div
        data-ring=""
        data-ring-active={inView ? "true" : "false"}
        style={{ "--ring-target": clamped } as CSSVars}
        className="absolute inset-0 rounded-full"
      />

      {/* Inner plate masks the track so only the arc reads. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute rounded-full bg-ink-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
          dimensions.inner,
        )}
      />

      <div
        aria-hidden="true"
        className="relative z-10 flex flex-col items-center leading-none"
      >
        <span
          className={cn(
            "font-display font-normal tracking-tight text-mist-50 tabular-nums",
            dimensions.text,
          )}
        >
          <CountUp value={clamped} />
          {showCaption ? (
            <span className="text-[0.5em] align-super text-mist-400">%</span>
          ) : null}
        </span>
        {showCaption ? (
          <span className="label-micro mt-2 text-mist-500">{label}</span>
        ) : null}
      </div>
    </div>
  );
}