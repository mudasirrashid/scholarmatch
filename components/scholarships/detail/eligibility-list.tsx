import { Badge } from "@/components/ui/badge";
import { CircleCheck, CircleHelp, CircleX } from "lucide-react";

import type { EligibilityCriterion, EligibilityStatus } from "@/types/scholarship";

/** Status is conveyed by an icon and a text label, never by colour alone. */
const STATUS_META: Record<
  EligibilityStatus,
  { label: string; tone: "positive" | "caution" | "neutral"; Icon: typeof CircleCheck }
> = {
  strong_match: { label: "Strong match", tone: "positive", Icon: CircleCheck },
  meets: { label: "You meet this", tone: "positive", Icon: CircleCheck },
  review: { label: "Needs review", tone: "caution", Icon: CircleHelp },
  not_eligible: { label: "Not eligible", tone: "caution", Icon: CircleX },
  not_specified: { label: "Not specified", tone: "neutral", Icon: CircleHelp },
};

/**
 * "Who can apply", one row per requirement.
 *
 * Rows needing work carry their remediation hint inline, which is the point of
 * the section: it converts a silent mismatch into a specific action.
 */
export function EligibilityList({ criteria }: { criteria: readonly EligibilityCriterion[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {criteria.map((criterion) => {
        // Sourced records carry no authored verdict, so they render the
        // requirement without a badge rather than a verdict nobody produced.
        const status = criterion.status;
        const meta = status === undefined ? undefined : STATUS_META[status];

        return (
          <li key={criterion.id} className="surface-glass relative overflow-hidden rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-mist-100">{criterion.label}</h3>
              {meta ? (
                <Badge tone={meta.tone} icon={<meta.Icon className="size-3" aria-hidden="true" />}>
                  {meta.label}
                </Badge>
              ) : null}
            </div>

            <p className="mt-2.5 text-[0.9375rem] text-pretty text-mist-300">{criterion.value}</p>

            {criterion.detail ? (
              <p className="mt-3 border-l-2 border-amber-400/40 pl-3 text-[0.8125rem] leading-relaxed text-pretty text-mist-400">
                {criterion.detail}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}