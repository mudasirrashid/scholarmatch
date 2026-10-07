import { Badge } from "@/components/ui/badge";

import type {
  ApplicationStage,
  CommonMistake,
  DocumentRequirement,
  FundingBenefit,
  HowToApplyStep,
  RequiredDocument,
} from "@/types/scholarship";

/**
 * Stands in when a provider publishes nothing for a section.
 *
 * An empty section reads as a rendering bug; a one-line statement that the
 * provider simply does not list this reads as what it actually is.
 */
function EmptySection({ children }: { children: React.ReactNode }) {
  return (
    <p className="surface-glass rounded-2xl p-5 text-[0.9375rem] leading-relaxed text-pretty text-mist-400">
      {children}
    </p>
  );
}

/** What the money actually covers, component by component. */
export function FundingBreakdown({
  summary,
  benefits,
}: {
  summary: string;
  benefits: readonly FundingBenefit[];
}) {
  return (
    <div>
      <p className="max-w-2xl text-pretty text-mist-300">{summary}</p>

      {benefits.length === 0 ? (
        <div className="mt-6">
          <EmptySection>
            The provider does not break this package down into components. Read the
            funding summary above, then confirm the details on their own site.
          </EmptySection>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <li key={benefit.id} className="surface-glass relative overflow-hidden rounded-2xl p-5">
              <p className="text-sm text-mist-400">{benefit.label}</p>
              <p className="mt-1.5 font-display text-xl font-normal tracking-[-0.01em] text-mist-50">
                {benefit.value}
              </p>
              {benefit.note ? (
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-pretty text-mist-500">
                  {benefit.note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DOCUMENT_TONE: Record<DocumentRequirement, "positive" | "neutral" | "caution"> = {
  required: "positive",
  conditional: "caution",
  optional: "neutral",
};

const DOCUMENT_LABEL: Record<DocumentRequirement, string> = {
  required: "Required",
  conditional: "Conditional",
  optional: "Optional",
};

/** Checklist of what to prepare, so nothing required is discovered late. */
export function DocumentChecklist({ documents }: { documents: readonly RequiredDocument[] }) {
  if (documents.length === 0) {
    return (
      <EmptySection>
        The provider does not publish a document list on the page this record was
        sourced from. Check the required documents on their own site before you start.
      </EmptySection>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {documents.map((document) => (
        <li
          key={document.id}
          className="surface-glass relative flex items-start justify-between gap-4 rounded-2xl p-4"
        >
          <div className="min-w-0">
            <p className="text-sm text-mist-100">{document.label}</p>
            {document.note ? (
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-pretty text-mist-500">
                {document.note}
              </p>
            ) : null}
          </div>

          <Badge tone={DOCUMENT_TONE[document.requirement]}>
            {DOCUMENT_LABEL[document.requirement]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/**
 * Application steps performed on the provider's own portal.
 *
 * Rendered as an ordered list so the sequence is conveyed structurally, with the
 * caution for each step attached to that step rather than collected elsewhere.
 */
export function ApplySteps({ steps }: { steps: readonly HowToApplyStep[] }) {
  if (steps.length === 0) {
    return (
      <EmptySection>
        The provider publishes its application instructions on its own site rather
        than in a form we can transcribe. Follow the official page linked above.
      </EmptySection>
    );
  }

  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {steps.map((step) => (
        <li key={step.index} className="surface-glass relative overflow-hidden rounded-2xl p-5">
          <span className="font-mono text-xs tracking-[0.08em] text-mist-600">
            {step.index}
          </span>

          <h3 className="mt-2 text-[0.9375rem] font-medium text-mist-50">{step.title}</h3>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-pretty text-mist-400">
            {step.description}
          </p>

          {step.caution ? (
            <p className="mt-3 border-l-2 border-amber-400/40 pl-3 text-[0.8125rem] leading-relaxed text-pretty text-amber-200/90">
              {step.caution}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/** The ScholarMatch-side journey, shown separately from provider-side steps. */
export function JourneyStages({ stages }: { stages: readonly ApplicationStage[] }) {
  return (
    <ol className="space-y-0">
      {stages.map((stage, index) => (
        <li key={stage.index} className="relative flex gap-5 pb-6 last:pb-0">
          {/* Connector line, hidden on the final stage. */}
          {index < stages.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-8 bottom-0 left-[0.6875rem] w-px bg-hairline"
            />
          ) : null}

          <span className="relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-hairline-strong bg-ink-900 font-mono text-[0.625rem] text-mist-400">
            {stage.index}
          </span>

          <div className="min-w-0 pt-0.5">
            <h3 className="text-[0.9375rem] font-medium text-mist-50">{stage.title}</h3>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-pretty text-mist-400">
              {stage.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Mistakes that cause rejections, each with the alternative that avoids it. */
export function MistakeList({ mistakes }: { mistakes: readonly CommonMistake[] }) {
  if (mistakes.length === 0) {
    return (
      <EmptySection>
        The provider does not publish a list of common mistakes for this award.
        The application guidance on their own site is the authoritative source.
      </EmptySection>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {mistakes.map((mistake) => (
        <li key={mistake.id} className="surface-glass relative overflow-hidden rounded-2xl p-5">
          <h3 className="text-sm text-mist-50">{mistake.title}</h3>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-pretty text-mist-400">
            {mistake.consequence}
          </p>
        </li>
      ))}
    </ul>
  );
}