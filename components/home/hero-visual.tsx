import { CircleCheck, Clock, MapPin, Sparkles } from "lucide-react";

import { ParallaxGroup } from "@/components/motion/parallax";
import { Badge } from "@/components/ui/badge";
import { MatchRing } from "@/components/ui/match-ring";
import { featuredScholarship, demoProfile } from "@/lib/demo/data";

/**
 * Hero visualisation.
 *
 * A purely interface-level composition illustrating the future matching
 * surface. Every value is drawn from the demo fixtures — there is no data
 * fetching, and nothing here should be read as a live result.
 */
export function HeroVisual() {
  const { title, organization, matchScore, degreeLabel, fundingLabel, deadlineInDays } =
    featuredScholarship;

  return (
    <ParallaxGroup className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Fixed aspect ratio on small screens so the composition keeps its
          proportions without relying on viewport height. */}
      <div className="relative aspect-[5/6] w-full sm:aspect-[16/13] lg:aspect-auto lg:h-[33rem]">
        {/* --- Connection lines (desktop only) --------------------------- */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          preserveAspectRatio="none"
          viewBox="0 0 520 528"
          fill="none"
        >
          <defs>
            <linearGradient id="hero-link" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M128 214 C 210 214, 214 300, 300 300"
            stroke="url(#hero-link)"
            strokeWidth="1.25"
            strokeDasharray="5 7"
            className="animate-dash-flow"
          />
          <path
            d="M120 336 C 208 336, 226 316, 300 312"
            stroke="url(#hero-link)"
            strokeWidth="1.25"
            strokeDasharray="5 7"
            className="animate-dash-flow"
            style={{ animationDelay: "-1.4s" }}
          />
        </svg>

        {/* --- Student profile card -------------------------------------- */}
        <div
          data-parallax-speed="26"
          className="absolute left-0 top-[8%] hidden w-[15.5rem] lg:block"
        >
          <div className="animate-drift-slow" style={{ animationDelay: "-2s" }}>
            <div className="surface-glass edge-highlight rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-hairline-strong bg-gradient-to-br from-azure-400/25 to-iris-500/25 font-mono text-xs text-mist-100"
                >
                  AR
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-mist-50">
                    {demoProfile.displayName}
                  </p>
                  <p className="truncate text-xs text-mist-400">
                    {demoProfile.degreeLabel}
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-hairline-soft pt-3.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-mist-500">Field</dt>
                  <dd className="truncate text-mist-200">{demoProfile.fieldLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-mist-500">Standing</dt>
                  <dd className="font-mono tabular-nums text-mist-200">
                    {demoProfile.academicScore}/100
                  </dd>
                </div>
              </dl>

              <ul className="mt-3.5 flex flex-wrap gap-1.5">
                {demoProfile.languages.map((language) => (
                  <li key={language}>
                    <Badge className="px-2 py-1 text-[0.625rem]">{language}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* --- Primary match card ----------------------------------------- */}
        <div
          data-parallax-speed="-18"
          className="absolute inset-x-0 top-[6%] sm:inset-x-auto sm:left-[14%] sm:w-[26rem] lg:left-[42%] lg:top-[16%] lg:w-[24rem]"
        >
          <div className="animate-drift">
            <article className="surface-glass-strong edge-highlight grain relative overflow-hidden rounded-3xl p-5 sm:p-6">
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs text-mist-400">
                      <MapPin
                        className="size-3.5 shrink-0 text-azure-300"
                        aria-hidden="true"
                      />
                      <span className="truncate">{organization}</span>
                    </p>
                    <h3 className="mt-2 text-[1.0625rem] leading-snug font-medium tracking-[-0.01em] text-balance text-mist-50">
                      {title}
                    </h3>
                  </div>

                  <MatchRing score={matchScore} size="sm" label="Match" />
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  <Badge tone="positive" icon={<CircleCheck className="size-3" aria-hidden="true" />}>
                    {fundingLabel}
                  </Badge>
                  <Badge tone="accent">{degreeLabel}</Badge>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-hairline-soft pt-4">
                  <span className="label-micro text-mist-500">Deadline</span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-mist-200">
                    <Clock
                      className="size-3.5 text-mist-500"
                      aria-hidden="true"
                    />
                    {deadlineInDays} days
                  </span>
                </div>
              </div>

              {/* Sweeping highlight, the one piece of continuous motion. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
              />
            </article>
          </div>
        </div>

        {/* --- Floating status chips ------------------------------------- */}
        <div
          data-parallax-speed="44"
          className="absolute right-0 top-[2%] sm:right-[2%] lg:-right-2 lg:top-[8%]"
        >
          <div className="animate-drift" style={{ animationDelay: "-1s" }}>
            <div className="surface-glass edge-highlight inline-flex items-center gap-2 rounded-full py-2 pr-4 pl-2.5">
              <span className="relative grid size-6 place-items-center">
                <span className="absolute inset-0 rounded-full bg-azure-400/25 animate-pulse-ring" />
                <Sparkles
                  className="relative size-3.5 text-azure-300"
                  aria-hidden="true"
                />
              </span>
              <span className="text-xs font-medium text-mist-100">
                3 new matches
              </span>
            </div>
          </div>
        </div>

        <div
          data-parallax-speed="-34"
          className="absolute bottom-[6%] left-[2%] sm:left-[6%] lg:left-0 lg:bottom-[14%]"
        >
          <div className="animate-drift-slow" style={{ animationDelay: "-3.2s" }}>
            <div className="surface-glass edge-highlight inline-flex items-center gap-2 rounded-full py-2 pr-4 pl-3">
              <CircleCheck
                className="size-4 shrink-0 text-mint-300"
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-mist-100">
                Eligibility verified
              </span>
            </div>
          </div>
        </div>

        {/* --- Transparency marker -------------------------------------- */}
        <p className="label-micro absolute inset-x-0 -bottom-1 text-center text-mist-600 lg:-bottom-6">
          Interface preview — sample data
        </p>
      </div>
    </ParallaxGroup>
  );
}