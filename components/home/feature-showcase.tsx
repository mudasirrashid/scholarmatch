import type { LucideIcon } from "lucide-react";
import { Route, ScanSearch, Compass, ListChecks } from "lucide-react";

import { RevealGroup } from "@/components/motion/reveal";
import { Reveal } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { FeatureBlock } from "@/types/scholarship";

const ICONS: Record<string, LucideIcon> = {
  matching: ScanSearch,
  eligibility: Compass,
  guidance: ListChecks,
  tracking: Route,
};

/**
 * Product capability overview.
 *
 * Describes the intended product surface rather than shipped functionality, so
 * each block is written as a capability statement and framed by the section
 * copy as forthcoming.
 */
export function FeatureShowcase({ features }: { features: readonly FeatureBlock[] }) {
  return (
    <Section tone="raised">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <Eyebrow>What we&rsquo;re building</Eyebrow>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="mt-6 font-display text-[2rem] leading-[1.08] font-normal tracking-[-0.015em] text-balance text-mist-50 sm:text-[2.75rem]">
                An assistant,
                <span className="mt-1 block text-mist-400">
                  not another search box.
                </span>
              </h2>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-mist-400">
                Discovery is only the first step. ScholarMatch is designed to
                stay useful all the way through an application &mdash; from
                first look to final submission.
              </p>
            </Reveal>
          </div>

          <RevealGroup
            as="ul"
            itemAs="li"
            className="flex flex-col gap-4"
            baseDelay={80}
            step={90}
          >
            {features.map((feature) => {
              const Icon = ICONS[feature.id] ?? Compass;

              return (
                <div
                  key={feature.id}
                  className="group surface-glass edge-highlight relative overflow-hidden rounded-3xl p-6 transition-[transform,border-color] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-hairline-strong sm:p-7"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -left-10 size-44 rounded-full bg-azure-400/12 opacity-0 blur-3xl transition-opacity duration-[520ms] group-hover:opacity-100"
                  />

                  <div className="relative flex gap-5">
                    <div className="flex flex-col items-center">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-hairline bg-white/[0.04] text-mist-200 transition-colors duration-300 group-hover:border-azure-400/30 group-hover:text-azure-300">
                        <Icon className="size-[1.125rem]" aria-hidden="true" />
                      </span>
                      <span className="label-micro mt-3 text-mist-600">
                        {feature.index}
                      </span>
                    </div>

                    <div className="min-w-0 pt-0.5">
                      <h3 className="text-lg font-medium tracking-[-0.015em] text-mist-50">
                        {feature.title}
                      </h3>
                      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-pretty text-mist-400">
                        {feature.description}
                      </p>

                      <ul className="mt-4 space-y-1.5">
                        {feature.highlights.map((highlight) => (
                          <li
                            key={highlight}
                            className="flex items-start gap-2.5 text-sm leading-relaxed text-mist-500"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 size-1 shrink-0 rounded-full bg-mist-600"
                            />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </RevealGroup>
        </div>
      </Container>
    </Section>
  );
}