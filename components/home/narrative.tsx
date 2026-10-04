import { CircleCheck, Layers, Sparkles, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

interface NarrativeStep {
  id: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  tone: "muted" | "neutral" | "accent" | "positive";
}

const TONE_STYLES: Record<NarrativeStep["tone"], string> = {
  muted: "border-hairline-soft bg-ink-900 text-mist-500",
  neutral: "border-hairline bg-ink-850 text-mist-200",
  accent: "border-azure-400/30 bg-azure-400/10 text-azure-300",
  positive: "border-mint-400/30 bg-mint-400/10 text-mint-300",
};

/**
 * Narrative flow describing the product's shift in behaviour.
 *
 * Deliberately avoids quantity claims: the problem is framed as a crowded
 * landscape rather than a specific number of listings, since no dataset
 * exists yet.
 */
const STEPS: readonly NarrativeStep[] = [
  {
    id: "landscape",
    label: "A crowded landscape",
    caption: "Listings scattered across sites, each with its own rules.",
    icon: Layers,
    tone: "muted",
  },
  {
    id: "profile",
    label: "One student profile",
    caption: "Your degree, field, standing and constraints, stated once.",
    icon: UserRound,
    tone: "neutral",
  },
  {
    id: "matching",
    label: "ScholarMatch intelligence",
    caption: "Every opportunity evaluated against that profile.",
    icon: Sparkles,
    tone: "accent",
  },
  {
    id: "shortlist",
    label: "A shortlist that fits",
    caption: "Ranked by fit, with the reasoning attached.",
    icon: CircleCheck,
    tone: "positive",
  },
];

export function Narrative() {
  return (
    <Section id="discover">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-20">
          {/* --- Copy --------------------------------------------------- */}
          <div>
            <Reveal>
              <Eyebrow>The shift</Eyebrow>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="mt-6 font-display text-[2rem] leading-[1.08] font-normal tracking-[-0.015em] text-balance text-mist-50 sm:text-[2.75rem] lg:text-[3.25rem]">
                Stop searching.
                <span className="mt-1 block text-mist-400">Start matching.</span>
              </h2>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-mist-400">
                Most scholarship search asks you to become the search engine:
                invent keywords, learn each site&rsquo;s filters, and read every
                listing to work out whether it applies to you.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-mist-500">
                ScholarMatch reverses that. You describe yourself once, and the
                work of narrowing the field happens on your behalf.
              </p>
            </Reveal>
          </div>

          {/* --- Flow ---------------------------------------------------- */}
          <div className="relative">
            {/* Rail: vertical on small screens, horizontal from `lg`. */}
            <span
              aria-hidden="true"
              className="absolute top-6 bottom-6 left-6 w-px bg-gradient-to-b from-transparent via-hairline-strong to-transparent lg:top-6 lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-full lg:bg-gradient-to-r"
            />

            <RevealGroup
              as="ol"
              itemAs="li"
              className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
              baseDelay={120}
              step={110}
            >
              {STEPS.map((step) => {
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex gap-4 lg:flex-col lg:gap-5">
                    <span
                      className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full border backdrop-blur-sm ${TONE_STYLES[step.tone]}`}
                    >
                      <Icon className="size-[1.125rem]" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 pt-1 lg:pt-0">
                      <p className="text-sm font-medium tracking-[-0.01em] text-pretty text-mist-50">
                        {step.label}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-pretty text-mist-500">
                        {step.caption}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RevealGroup>
          </div>
        </div>
      </Container>
    </Section>
  );
}