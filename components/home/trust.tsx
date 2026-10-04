import { Eye, Gauge, HeartHandshake, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

interface Principle {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Product philosophy.
 *
 * States principles rather than metrics: no adoption figures, partner counts
 * or outcome statistics appear here, because none exist yet.
 */
const PRINCIPLES: readonly Principle[] = [
  {
    id: "relevance",
    title: "Relevance over volume",
    description:
      "A shortlist you can act on beats an endless feed. If an opportunity does not fit, we would rather say so than pad the list.",
    icon: Gauge,
  },
  {
    id: "clarity",
    title: "Clarity over jargon",
    description:
      "Eligibility written the way an adviser would explain it, not the way a programme brochure would.",
    icon: Eye,
  },
  {
    id: "transparency",
    title: "Transparency by default",
    description:
      "You see which factors produced a match score, and what is still missing. No unexplained numbers.",
    icon: Scale,
  },
  {
    id: "guidance",
    title: "Guidance, not gatekeeping",
    description:
      "Where you fall short, you are told what would close the gap &mdash; never left to guess.",
    icon: HeartHandshake,
  },
];

export function Trust() {
  return (
    <Section id="philosophy">
      <Container>
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow>Our philosophy</Eyebrow>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-6 font-display text-[2rem] leading-[1.08] font-normal tracking-[-0.015em] text-balance text-mist-50 sm:text-[2.75rem] lg:text-[3.5rem]">
              Built around the student,
              <span className="mt-1 block text-mist-400">not the search box.</span>
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-mist-400">
              Scholarship directories are optimised for volume, because volume is
              what keeps a directory busy. We are optimising for the moment a
              student stops reading and starts applying.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          as="ul"
          itemAs="li"
          className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-16"
          baseDelay={80}
          step={90}
        >
          {PRINCIPLES.map((principle) => {
            const Icon = principle.icon;

            return (
              <div key={principle.id} className="max-w-sm">
                <span className="inline-grid size-10 place-items-center rounded-full border border-hairline bg-white/[0.04] text-mist-300">
                  <Icon className="size-4" aria-hidden="true" />
                </span>

                <h3 className="mt-5 text-lg font-medium tracking-[-0.015em] text-mist-50">
                  {principle.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-pretty text-mist-400">
                  {principle.description}
                </p>
              </div>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}