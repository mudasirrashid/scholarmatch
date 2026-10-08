"use client";

import { ClipboardCheck, Compass, FileText, Radar, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useInView } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { JourneyStage, JourneyStageId } from "@/types/scholarship";

const STAGE_ICONS: Record<JourneyStageId, LucideIcon> = {
  discover: Radar,
  check: Compass,
  prepare: FileText,
  apply: Send,
  track: ClipboardCheck,
};

/**
 * End-to-end journey preview.
 *
 * The rail fills as the section enters the viewport, which reads as forward
 * motion through the five stages without hijacking scroll. Two rails are
 * rendered — vertical below `lg`, horizontal above — because a single element
 * cannot change its transform axis responsively.
 */
export function Journey({ stages }: { stages: readonly JourneyStage[] }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  const railFill = "bg-gradient-to-b from-azure-400 to-iris-400 lg:bg-gradient-to-r";

  return (
    <div ref={ref} className="relative mt-14 lg:mt-20">
      {/* Vertical rail (small screens) */}
      <div
        aria-hidden="true"
        className="absolute top-7 bottom-7 left-[1.4375rem] w-px bg-white/[0.07] lg:hidden"
      >
        <div
          data-meter-y={inView ? "filled" : "empty"}
          className={cn("h-full w-full origin-top", railFill)}
        />
      </div>

      {/* Horizontal rail (large screens) */}
      <div
        aria-hidden="true"
        className="absolute top-7 right-16 left-16 hidden h-px bg-white/[0.07] lg:block"
      >
        <div
          data-meter={inView ? "filled" : "empty"}
          className={cn("h-full w-full", railFill)}
        />
      </div>

      <ol className="relative grid gap-10 lg:grid-cols-5 lg:gap-6">
        {stages.map((stage, index) => {
          const Icon = STAGE_ICONS[stage.id] ?? Compass;

          return (
            <li key={stage.id} className="relative flex gap-5 lg:flex-col lg:gap-6">
              <span
                className={cn(
                  "relative z-10 grid size-[2.875rem] shrink-0 place-items-center rounded-full border bg-ink-900 transition-colors duration-500",
                  inView
                    ? "border-azure-400/40 text-azure-300"
                    : "border-hairline text-mist-600",
                )}
              >
                <Icon className="size-[1.0625rem]" aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <p className="label-micro text-mist-500">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2.5 text-lg font-medium tracking-[-0.015em] text-mist-50">
                  {stage.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-mist-500">
                  {stage.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}