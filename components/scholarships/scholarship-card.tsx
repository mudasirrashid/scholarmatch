import { ArrowUpRight, CircleCheck, Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatDeadline, isUrgent, matchTone } from "@/lib/format";
import type { ScholarshipPreview } from "@/types/scholarship";

/**
 * Reusable opportunity card.
 *
 * Intentionally a server component: cards appear many times on discovery
 * surfaces, so they carry no client JavaScript and animate entirely through
 * CSS on hover and focus-within.
 *
 * `href` is optional. Until real routes exist, omitting it renders the card as
 * a non-interactive preview rather than linking somewhere that would 404.
 */
export function ScholarshipCard({
  scholarship,
  href,
  className,
  priority,
}: {
  scholarship: ScholarshipPreview;
  /** Destination for the primary action. Omit for a static preview card. */
  href?: string;
  className?: string;
  /** Raises the first card to match the visual weight of the layout. */
  priority?: boolean;
}) {
  const {
    id,
    title,
    organization,
    country,
    matchScore,
    degreeLabel,
    fundingLabel,
    deadlineInDays,
    tags,
  } = scholarship;

  const tone = matchTone(matchScore);
  const urgent = isUrgent(deadlineInDays);

  return (
    <article
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-3xl p-6",
        "surface-glass edge-highlight",
        // Lift, border and glow are all driven by hover/focus-within so the
        // whole surface behaves as one control.
        "transition-[transform,box-shadow,border-color] duration-[420ms]",
        "ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-1 hover:border-hairline-strong",
        "hover:shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_36px_64px_-32px_rgba(2,8,23,0.95),0_0_44px_-18px_rgba(56,189,248,0.35)]",
        "focus-within:-translate-y-1 focus-within:border-hairline-strong",
        priority && "lg:p-7",
        className,
      )}
    >
      {/* Accent bloom keyed to match strength. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-24 -right-16 size-56 rounded-full opacity-0 blur-3xl transition-opacity duration-[520ms] group-hover:opacity-100",
          tone === "positive"
            ? "bg-mint-400/20"
            : tone === "accent"
              ? "bg-azure-400/20"
              : "bg-amber-400/16",
        )}
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-mist-400">
              <MapPin className="size-3.5 shrink-0 text-mist-500" aria-hidden="true" />
              <span className="truncate">{organization}</span>
            </p>

            <h3
              className={cn(
                "mt-2.5 font-medium tracking-[-0.015em] text-balance text-mist-50",
                priority ? "text-xl" : "text-lg",
              )}
            >
              {title}
            </h3>

            <p className="mt-1.5 text-xs text-mist-500">{country}</p>
          </div>

          {/* Match score */}
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "font-display text-3xl leading-none font-normal tabular-nums",
                tone === "positive"
                  ? "text-mint-300"
                  : tone === "accent"
                    ? "text-azure-300"
                    : "text-amber-300",
              )}
            >
              {matchScore}
              <span className="text-[0.55em] align-super">%</span>
            </p>
            <p className="label-micro mt-1.5 text-mist-500">Match</p>
          </div>
        </div>

        {/* Match strength bar */}
        <div
          aria-hidden="true"
          className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]"
        >
          <div
            className={cn(
              "h-full rounded-full",
              tone === "positive"
                ? "bg-gradient-to-r from-mint-500 to-mint-300"
                : tone === "accent"
                  ? "bg-gradient-to-r from-azure-500 to-azure-300"
                  : "bg-gradient-to-r from-amber-500 to-amber-300",
            )}
            style={{ width: `${matchScore}%` }}
          />
        </div>

        {/* Attributes */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          <Badge
            tone={scholarship.funding === "fully_funded" ? "positive" : "neutral"}
            icon={<CircleCheck className="size-3" aria-hidden="true" />}
          >
            {fundingLabel}
          </Badge>
          <Badge>{degreeLabel}</Badge>
        </div>

        {tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="font-mono text-[0.6875rem] tracking-[0.06em] text-mist-500"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Footer */}
        <div className="mt-auto pt-6">
          <div className="rule-fade" />

          <div className="mt-4 flex items-center justify-between gap-4">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-sm",
                urgent ? "text-amber-300" : "text-mist-300",
              )}
            >
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              {formatDeadline(deadlineInDays)}
            </span>

            {href ? (
              <a
                href={href}
                aria-label={`View ${title}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-mist-100 transition-colors duration-200 hover:text-white"
              >
                View Opportunity
                <ArrowUpRight
                  className="size-3.5 transition-transform duration-[320ms] ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-mist-500">
                Preview only
                <ArrowUpRight className="size-3.5 opacity-50" aria-hidden="true" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Whole-card affordance, only when the card is actually navigable. */}
      {href ? (
        <a
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-3xl"
        />
      ) : null}

      <span className="sr-only">{`Opportunity identifier ${id}`}</span>
    </article>
  );
}