import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { AmbientField } from "@/components/ui/ambient-field";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Closing conversion section.
 *
 * Accounts do not exist yet, so the primary action resolves to a transparent
 * "not yet available" state rather than a dead link. The secondary action is
 * real: it leads to the scholarship explorer.
 */
export function FinalCta() {
  return (
    <section id="final-cta" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32 lg:py-40">
      <AmbientField intensity="subtle" />

      <Container>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="label-micro text-azure-300/90">Coming next</p>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-6 font-display text-[2.25rem] leading-[1.05] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-[3.25rem] lg:text-[4rem]">
              Your next opportunity
              <span className="mt-1.5 block text-gradient">
                deserves a better search.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
              ScholarMatch is in active development. Create your profile once,
              and we&rsquo;ll take it from there.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="primary" size="lg" disabled>
                Start Your Journey
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>

              <Button href="/scholarships" variant="secondary" size="lg">
                Browse opportunities
              </Button>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <p
              id="cta-availability"
              className="mt-6 text-sm text-mist-500"
              role="status"
            >
              Accounts are not open yet. This page is a preview of the product in
              progress.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}