import { CircleCheck, TriangleAlert } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { MatchMeter } from "@/components/ui/match-meter";
import { MatchRing } from "@/components/ui/match-ring";
import { Section, SectionHeading } from "@/components/ui/section";
import { featuredScholarship } from "@/lib/demo/data";

/**
 * Walkthrough of a single match.
 *
 * Renders `ScholarshipPreview` directly, so swapping the demo fixture for a
 * real record requires no changes to this component. All scoring visuals are
 * illustrative.
 */
export function MatchingPreview() {
  const {
    title,
    organization,
    country,
    degreeLabel,
    fundingLabel,
    factors,
    reasons,
    requirements,
  } = featuredScholarship;

  return (
    <Section id="matching" tone="raised">
      <Container>
        <SectionHeading
          eyebrow="Inside a match"
          title={
            <>
              Not just a score.
              <span className="mt-1 block text-mist-400">
                The reasoning behind it.
              </span>
            </>
          }
          description="A percentage on its own tells you nothing. Every match in ScholarMatch arrives with the factors that produced it, the reasons it works, and the one thing standing between you and a complete application."
          size="large"
        />

        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* --- Factor breakdown -------------------------------------- */}
          <Reveal className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs text-mist-500">{organization}</p>
                <h3 className="mt-2 text-xl font-medium tracking-[-0.015em] text-balance text-mist-50 sm:text-2xl">
                  {title}
                </h3>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Badge tone="positive">{fundingLabel}</Badge>
                  <Badge tone="accent">{degreeLabel}</Badge>
                  <Badge>{country}</Badge>
                </div>
              </div>

              <MatchRing
                score={featuredScholarship.matchScore}
                size="lg"
                label="Match"
              />
            </div>

            <div className="rule-fade my-8" />

            <div className="space-y-6">
              <p className="label-micro text-mist-500">Match breakdown</p>

              {factors.map((factor, index) => (
                <MatchMeter
                  key={factor.id}
                  label={factor.label}
                  score={factor.score}
                  delay={index * 120}
                />
              ))}
            </div>
          </Reveal>

          {/* --- Reasoning ---------------------------------------------- */}
          <div className="flex flex-col gap-6">
            <Reveal
              delay={120}
              className="surface-glass edge-highlight flex-1 rounded-3xl p-6 sm:p-7"
            >
              <div className="flex items-center gap-2.5">
                <CircleCheck
                  className="size-4 shrink-0 text-mint-300"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium tracking-[-0.01em] text-mist-50">
                  Why you match
                </h3>
              </div>

              <ul className="mt-5 space-y-3.5">
                {reasons.map((reason) => (
                  <li
                    key={reason.id}
                    className="flex items-start gap-3 text-sm leading-relaxed text-pretty text-mist-300"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mint-400/70"
                    />
                    {reason.label}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal
              delay={200}
              className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.05] p-6 backdrop-blur-sm sm:p-7"
            >
              <div className="flex items-center gap-2.5">
                <TriangleAlert
                  className="size-4 shrink-0 text-amber-300"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium tracking-[-0.01em] text-mist-50">
                  One thing to improve
                </h3>
              </div>

              <ul className="mt-5 space-y-4">
                {requirements.map((requirement) => (
                  <li key={requirement.id}>
                    <p className="flex items-start gap-3 text-sm leading-relaxed text-pretty text-mist-200">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400/70"
                      />
                      {requirement.label}
                    </p>
                    {requirement.hint ? (
                      <p className="mt-1.5 pl-6 text-sm leading-relaxed text-pretty text-mist-500">
                        {requirement.hint}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <Reveal delay={120}>
          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-mist-600">
            Illustrative interface. Match factors, scores and requirements shown
            here are sample content and are not calculated from real data.
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}