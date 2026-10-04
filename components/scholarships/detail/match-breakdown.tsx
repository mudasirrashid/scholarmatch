import { Badge } from "@/components/ui/badge";
import { StatusBar } from "@/components/scholarships/detail/status-bar";
import { scoreForStatus } from "@/lib/scholarships/preview";
import type { EligibilityStatus, MatchInsights } from "@/types/scholarship";

/** Reads a status as a short, plain-language verdict. */
const VERDICT_TONE: Record<EligibilityStatus, { label: string; tone: "positive" | "neutral" | "caution" }> =
  {
    strong_match: { label: "Strong", tone: "positive" },
    meets: { label: "Meets", tone: "positive" },
    review: { label: "Review", tone: "caution" },
    not_eligible: { label: "Not eligible", tone: "caution" },
    not_specified: { label: "Not specified", tone: "neutral" },
  };

/**
 * Explains the overall score.
 *
 * The score alone is not actionable, so every dimension behind it is listed
 * with its own verdict, and dimensions needing work carry the remediation hint
 * that turns a rejection into a to-do item.
 */
export function MatchBreakdown({ match }: { match: MatchInsights }) {
  return (
    <div>
      <p className="max-w-2xl text-pretty text-mist-300">{match.summary}</p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {match.breakdown.map((item) => {
          const verdict = VERDICT_TONE[item.status];

          return (
            <li
              key={item.id}
              className="surface-glass relative overflow-hidden rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-mist-100">{item.label}</p>
                  <p className="mt-1 text-[0.8125rem] text-mist-400">{item.verdict}</p>
                </div>

                <Badge tone={verdict.tone}>{verdict.label}</Badge>
              </div>

              <div className="mt-4">
                <StatusBar
                  label={item.label}
                  value={scoreForStatus(item.status)}
                  status={item.status}
                />
              </div>

              {item.detail ? (
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-pretty text-mist-400">
                  {item.detail}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {match.strengths.length > 0 || match.warnings.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {match.strengths.length > 0 ? (
            <div className="surface-glass rounded-2xl p-5">
              <h3 className="text-sm font-medium text-mist-100">What stands out</h3>
              <ul className="mt-3 space-y-2">
                {match.strengths.map((strength) => (
                  <li key={strength} className="flex gap-2.5 text-sm text-mist-300">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-mint-400" aria-hidden="true" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {match.warnings.length > 0 ? (
            <div className="surface-glass rounded-2xl p-5">
              <h3 className="text-sm font-medium text-mist-100">Before you apply</h3>
              <ul className="mt-3 space-y-2">
                {match.warnings.map((warning) => (
                  <li key={warning} className="flex gap-2.5 text-sm text-mist-300">
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full bg-amber-400"
                      aria-hidden="true"
                    />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}