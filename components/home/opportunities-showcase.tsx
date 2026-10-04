import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section, SectionHeading } from "@/components/ui/section";
import { additionalScholarships, featuredScholarship } from "@/lib/demo/data";

/**
 * Opportunity grid demonstrating the card across a range of match strengths,
 * funding models and deadline pressure.
 */
export function OpportunitiesShowcase() {
  const scholarships = [featuredScholarship, ...additionalScholarships];

  return (
    <Section id="how-it-works">
      <Container>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="A shortlist, not a feed"
            title={
              <>
                Ranked by fit.
                <span className="mt-1 block text-mist-400">Not by noise.</span>
              </>
            }
            description="Every entry arrives with its match strength visible up front, so you can tell at a glance which ones deserve your attention."
          />

          <Reveal delay={200} className="shrink-0">
            <p className="max-w-xs text-sm leading-relaxed text-pretty text-mist-500">
              Cards below are static previews &mdash; nothing is clickable while
              the product is in preview.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3"
          baseDelay={100}
          step={110}
        >
          {scholarships.map((scholarship, index) => (
            <ScholarshipCard
              key={scholarship.id}
              scholarship={scholarship}
              priority={index === 0}
            />
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}