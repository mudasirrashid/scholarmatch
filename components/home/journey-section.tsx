import { Journey } from "@/components/home/journey-track";
import { Reveal } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { journeyStages } from "@/lib/demo/data";

export function JourneySection() {
  return (
    <Section id="journey" tone="raised">
      <Container>
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow>The full journey</Eyebrow>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-6 font-display text-[2rem] leading-[1.08] font-normal tracking-[-0.015em] text-balance text-mist-50 sm:text-[2.75rem] lg:text-[3.5rem]">
              Useful long after
              <span className="mt-1 block text-mist-400">you find it.</span>
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-mist-400">
              Finding a scholarship is one step. ScholarMatch is designed to
              carry you through the parts that usually follow &mdash; the
              requirements, the documents, the deadlines and the waiting.
            </p>
          </Reveal>
        </div>

        <Journey stages={journeyStages} />
      </Container>
    </Section>
  );
}