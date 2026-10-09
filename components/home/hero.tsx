import { ArrowRight, UserRound } from "lucide-react";

import { HeroVisual } from "@/components/home/hero-visual";
import { Reveal } from "@/components/motion/reveal";
import { AmbientField } from "@/components/ui/ambient-field";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pt-44 lg:pb-32">
      <AmbientField />

      <Container size="wide">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-20">
          {/* --- Copy --------------------------------------------------- */}
          <div className="relative z-10 max-w-2xl">
            <Reveal>
              <p className="inline-flex items-center gap-2.5 rounded-full border border-hairline bg-tint/[0.04] py-1.5 pr-4 pl-1.5 text-xs text-mist-300 backdrop-blur-sm">
                <span className="relative grid size-5 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-azure-400/25 animate-pulse-ring" />
                  <span className="relative size-1.5 rounded-full bg-azure-300" />
                </span>
                Free &middot; no account needed
              </p>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="mt-7 font-display text-[2.75rem] leading-[1.02] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-[3.75rem] lg:text-[4.5rem] xl:text-[5rem]">
                Your next opportunity is out there.
                <span className="mt-2 block text-gradient">
                  We&rsquo;ll help you find it.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-pretty text-mist-400 sm:text-xl">
                ScholarMatch reads your academic profile and surfaces the
                scholarships that genuinely fit it &mdash; then explains why each
                one belongs on your shortlist.
              </p>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/scholarships" variant="primary" size="lg">
                  Find My Scholarships
                  <ArrowRight
                    className="size-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Button>

                <Button href="/profile" variant="secondary" size="lg">
                  <UserRound className="size-4 text-mist-400" aria-hidden="true" />
                  Build Your Profile
                </Button>
              </div>
            </Reveal>

            <Reveal delay={340}>
              <p className="mt-8 max-w-md text-xs leading-relaxed text-mist-500">
                There are no accounts yet: your profile, saved scholarships and
                tracked applications are stored in this browser only.
              </p>
            </Reveal>
          </div>

          {/* --- Visualisation ------------------------------------------- */}
          <div className="relative z-10">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}