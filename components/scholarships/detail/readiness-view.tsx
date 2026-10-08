import { CircleCheck, CircleHelp, CircleX, Clock, FileText, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  PREPARATION_CATEGORY_LABEL,
  PREPARATION_PRIORITY_LABEL,
  PREPARATION_STATUS_LABEL,
  READINESS_LEVEL_LABEL,
} from "@/lib/preparation";

import type {
  PreparationCategory,
  PreparationPriority,
  PreparationStatus,
  ReadinessAssessment,
} from "@/lib/preparation";

/**
 * Renders a readiness assessment.
 *
 * Pure and server-safe: given the same assessment it always renders the same
 * markup, which is why the sample-context fallback on the detail page and the
 * personalised state after hydration can share one component without either
 * drifting from the other.
 */

const STATUS_TONE: Record<
  PreparationStatus,
  "neutral" | "positive" | "caution" | "accent"
> = {
  satisfied: "positive",
  known: "accent",
  unknown: "neutral",
  not_met: "caution",
  not_required: "neutral",
};

const LEVEL_TONE: Record<ReadinessAssessment["level"], "neutral" | "positive" | "caution" | "accent"> = {
  ready: "positive",
  nearly_ready: "accent",
  preparation_needed: "caution",
  eligibility_issue: "caution",
  information_needed: "neutral",
};

const PRIORITY_TONE: Record<PreparationPriority, "neutral" | "positive" | "caution" | "accent"> = {
  critical: "caution",
  high: "accent",
  medium: "neutral",
  low: "neutral",
};

/** Categories, in checklist display order. */
const CATEGORY_ORDER: readonly PreparationCategory[] = [
  "eligibility",
  "academic",
  "identity",
  "language",
  "experience",
  "writing",
  "recommendations",
  "research",
  "creative",
  "application",
];

function StatusIcon({ status }: { status: PreparationStatus }) {
  switch (status) {
    case "satisfied":
      return <CircleCheck className="size-4 shrink-0 text-mint-300" aria-hidden="true" />;
    case "known":
      return <CircleCheck className="size-4 shrink-0 text-azure-300" aria-hidden="true" />;
    case "not_met":
      return <CircleX className="size-4 shrink-0 text-amber-300" aria-hidden="true" />;
    default:
      return <CircleHelp className="size-4 shrink-0 text-mist-500" aria-hidden="true" />;
  }
}

function ReadinessStats({ assessment }: { assessment: ReadinessAssessment }) {
  const value = (label: string, body: string, urgent = false) => (
    <div>
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd className={`mt-1 text-sm ${urgent ? "text-amber-300" : "text-mist-200"}`}>{body}</dd>
    </div>
  );

  return (
    <dl className="mt-6 grid gap-4 border-t border-hairline pt-6 sm:grid-cols-3">
      {value("Eligibility", assessment.eligibilityLabel)}
      {value("Deadline", assessment.deadline.label, assessment.deadline.urgent)}
      {value(
        "Attention",
        assessment.attention === 0
          ? "Nothing outstanding"
          : `${assessment.attention} item${assessment.attention === 1 ? "" : "s"} need attention`,
      )}
    </dl>
  );
}

function ReadinessChecklist({ assessment }: { assessment: ReadinessAssessment }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <FileText className="size-4 text-mist-500" aria-hidden="true" />
        <h3 className="text-sm font-medium text-mist-100">What to prepare</h3>
      </div>

      <div className="mt-4 space-y-4">
        {CATEGORY_ORDER.map((category) => {
          const items = assessment.requirements.filter(
            (requirement) => requirement.category === category,
          );
          if (items.length === 0) return null;

          return (
            <div key={category} className="surface-glass rounded-2xl p-5">
              <h4 className="label-micro text-mist-500">
                {PREPARATION_CATEGORY_LABEL[category]}
              </h4>

              <ul className="mt-2 divide-y divide-hairline">
                {items.map((requirement) => (
                  <li
                    key={requirement.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusIcon status={requirement.status} />
                        <p className="text-sm text-mist-100">{requirement.label}</p>
                        {requirement.requirement !== "required" ? (
                          <Badge tone="neutral">
                            {requirement.requirement === "conditional" ? "Conditional" : "Optional"}
                          </Badge>
                        ) : null}
                      </div>

                      {requirement.detail ? (
                        <p className="mt-1 max-w-xl text-[0.8125rem] leading-relaxed text-mist-400">
                          {requirement.detail}
                        </p>
                      ) : null}
                    </div>

                    <Badge tone={STATUS_TONE[requirement.status]}>
                      {PREPARATION_STATUS_LABEL[requirement.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreparationPlan({ assessment }: { assessment: ReadinessAssessment }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <ListChecks className="size-4 text-mist-500" aria-hidden="true" />
        <h3 className="text-sm font-medium text-mist-100">Your preparation plan</h3>
      </div>

      <ol className="mt-4 space-y-3">
        {assessment.plan.map((step, index) => (
          <li key={step.id} className="surface-glass flex gap-4 rounded-2xl p-5">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium text-mist-300"
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-mist-100">{step.title}</p>
                <Badge tone={PRIORITY_TONE[step.priority]}>
                  {PREPARATION_PRIORITY_LABEL[step.priority]}
                </Badge>
              </div>

              <p className="mt-1 text-[0.8125rem] leading-relaxed text-pretty text-mist-400">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ReadinessView({ assessment }: { assessment: ReadinessAssessment }) {
  return (
    <div>
      <div className="surface-glass edge-highlight relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-micro text-mist-500">Readiness</p>
            <p className="mt-1 font-display text-5xl font-normal tracking-[-0.02em] text-balance text-mist-50">
              {assessment.percent}
              <span className="text-2xl text-mist-500">%</span>
            </p>
          </div>

          <Badge tone={LEVEL_TONE[assessment.level]}>
            {READINESS_LEVEL_LABEL[assessment.level]}
          </Badge>
        </div>

        <p className="mt-4 max-w-2xl text-pretty text-mist-300">{assessment.summary}</p>

        <ReadinessStats assessment={assessment} />
      </div>

      <div className="mt-8">
        <ReadinessChecklist assessment={assessment} />
      </div>

      <div className="mt-8">
        <PreparationPlan assessment={assessment} />
      </div>

      {assessment.deadline.kind === "exact" && assessment.deadline.urgent ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5">
          <Clock className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-[0.8125rem] leading-relaxed text-pretty text-amber-200">
            The deadline is approaching ({assessment.deadline.label}). Applications are
            reviewed on the awarding body&apos;s own portal, so put the documents below first.
          </p>
        </div>
      ) : null}
    </div>
  );
}