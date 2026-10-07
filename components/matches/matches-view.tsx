"use client";

import { Compass, UserRound } from "lucide-react";

import { MatchBreakdown } from "@/components/scholarships/detail/match-breakdown";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { ScholarshipGridSkeleton } from "@/components/scholarships/scholarship-card-skeleton";
import { SavedProvider } from "@/components/scholarships/saved-provider";
import { ProfileProvider, useProfile } from "@/components/profile/profile-provider";
import { Reveal } from "@/components/motion/reveal";
import { AmbientField } from "@/components/ui/ambient-field";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { groupRecommendations, rankScholarships, toMatchInsights } from "@/lib/matching";
import { isProvisional, profileCompletion } from "@/lib/profile/completion";
import { allScholarships, toPreview } from "@/lib/scholarships";

import type { RecommendationBand } from "@/lib/matching";
import type { RankedScholarship } from "@/types/matching";

/**
 * Personalised matches surface.
 *
 * One client island, for the same reason `/profile` is one: the ranking is a
 * function of a profile in `localStorage`, which the server cannot read. Nothing
 * here scores anything. `rankScholarships` produces the order,
 * `groupRecommendations` reshapes that order into bands, and
 * `toPreview`/`toMatchInsights` adapt engine output for the card and breakdown
 * components that already render it. There is no second opinion anywhere in this
 * file.
 *
 * The engine is pure and synchronous, so once the stored profile has been read
 * there is nothing to wait for and no score can flash from one value to another.
 * The only states worth handling are therefore: still reading, nothing stored,
 * stored but unreadable, and a ranking that is provisional because the profile
 * is thin.
 */

/** Cards shown in the "top matches" rail, before the per-band listings. */
const TOP_MATCH_COUNT = 3;

/**
 * Destination for every card here.
 *
 * `?mine=1` is the visitor saying "score this against my own profile". The detail
 * page cannot work that out on its own, because the profile lives in
 * `localStorage` and the server cannot read it. Carrying the intent in the URL is
 * what lets the page render the reader's own figure in the first paint instead of
 * quoting the sample profile's, which is what made a card promise 62% and the
 * page behind it promise 95%.
 *
 * The explorer's own links stay bare, so a record reached from `/scholarships`
 * keeps the sample context its card was scored in.
 */
function detailHref(id: string): string {
  return `/scholarships/${id}?mine=1`;
}

export function MatchesView() {
  return (
    <SavedProvider>
      <ProfileProvider>
        <MatchesViewInner />
      </ProfileProvider>
    </SavedProvider>
  );
}

function MatchesViewInner() {
  const { profile, isHydrated, isUnreadable } = useProfile();

  // `allScholarships` is a static array, so this recomputes only when the stored
  // profile object changes identity, which `write` guarantees it does.
  const ranked = rankScholarships(profile, allScholarships());
  const completion = profileCompletion(profile);
  const provisional = isProvisional(completion);
  const groups = groupRecommendations(ranked);

  const top = ranked.slice(0, TOP_MATCH_COUNT);
  const topIds = new Set(top.map((entry) => entry.scholarship.id));

  /*
    Bands list what the top rail did not already show. Duplicating the strongest
    results in both places would make the page look longer without giving the
    student anything new to read.
  */
  const remainingBands: RecommendationBand[] = groups.bands
    .map((band) => ({ ...band, entries: band.entries.filter((entry) => !topIds.has(entry.scholarship.id)) }))
    .filter((band) => band.entries.length > 0);

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-10 sm:pt-36 lg:pt-40">
        <AmbientField />
        <Container size="wide" className="relative">
          <Eyebrow>Your matches</Eyebrow>
          <h1 className="mt-6 max-w-3xl font-display text-[2.25rem] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl lg:text-[3.75rem]">
            Opportunities ranked for you.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
            Every record in the collection, scored against your own answers and
            ordered by what you can actually apply to.
          </p>

          {/*
            The same disclosure the explorer and detail pages carry. Scores are
            computed from each record's published requirements — sample records
            are illustrative, sourced records transcribe the provider's own
            pages — so a personalised page must not read as a live guarantee.
          */}
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-pretty text-mist-500">
            Sample records are illustrative; sourced records reflect what the provider
            published when we last checked. Confirm anything you rely on against the
            awarding body&apos;s own site.
          </p>

          {isHydrated && !isUnreadable && completion.answeredCount > 0 ? (
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Badge tone={groups.eligibleCount > 0 ? "positive" : "caution"}>
                {groups.eligibleCount} of {ranked.length} eligible
              </Badge>
              <Badge tone="neutral">{completion.percent}% profile complete</Badge>
              {provisional ? (
                <Badge tone="caution">
                  {groups.provisionalCount} results are provisional
                </Badge>
              ) : null}
            </div>
          ) : null}
        </Container>
      </section>

      <Container size="wide" className="pb-24">
        {/* Still reading localStorage. Nothing about the stored profile can be
            known on the server, so this is the only honest first paint. */}
        {!isHydrated ? (
          <div className="mt-10">
            <p aria-live="polite" className="text-sm text-mist-500">
              Reading your saved profile.
            </p>
            <div className="mt-6">
              <ScholarshipGridSkeleton />
            </div>
          </div>
        ) : isUnreadable ? (
          <UnreadableProfileState />
        ) : completion.answeredCount === 0 ? (
          <EmptyProfileState />
        ) : (
          <>
            <ProfileProgress />

            <section aria-labelledby="top-matches-heading" className="mt-16">
              <Reveal>
                <h2
                  id="top-matches-heading"
                  className="font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl"
                >
                  Top matches
                </h2>
                <p className="mt-2 max-w-xl text-pretty text-mist-400">
                  The {Math.min(TOP_MATCH_COUNT, ranked.length)} strongest results in your
                  ranking, in the order the engine put them.
                </p>

                <ul className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {top.map((entry, index) => (
                    <li key={entry.scholarship.id} className="h-full min-w-0">
                      <ScholarshipCard
                        scholarship={toPreview(
                          entry.scholarship,
                          toMatchInsights(entry.match),
                        )}
                        href={detailHref(entry.scholarship.id)}
                        priority={index === 0}
                      />
                    </li>
                  ))}
                </ul>
              </Reveal>
            </section>

            <section aria-labelledby="why-heading" className="mt-20">
              <Reveal>
                <h2
                  id="why-heading"
                  className="font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl"
                >
                  Why these match
                </h2>
                <p className="mt-2 max-w-xl text-pretty text-mist-400">
                  The same breakdown the scholarship page shows, split by the six
                  dimensions the engine scores.
                </p>

                <div className="mt-7 space-y-6">
                  {top.map((entry) => (
                    <WhyThisMatches key={entry.scholarship.id} entry={entry} />
                  ))}
                </div>
              </Reveal>
            </section>

            <section aria-labelledby="bands-heading" className="mt-20">
              <Reveal>
                <h2
                  id="bands-heading"
                  className="font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl"
                >
                  All matches by category
                </h2>
                <p className="mt-2 max-w-xl text-pretty text-mist-400">
                  Grouped by fit. What you cannot apply to is kept at the bottom, with
                  the requirement that blocks it, rather than hidden.
                </p>

                {/*
                  Band copy describes fit, so it would overstate what is known when
                  every single result is provisional. Said once, here, rather than
                  repeated per band.
                */}
                {groups.provisionalCount === ranked.length ? (
                  <p className="mt-5 flex max-w-2xl gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3.5 text-sm leading-relaxed text-mist-300">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                    <span>
                      Every result below is provisional: too little of your profile could
                      be checked for the band to mean much yet. Completing the fields above
                      is what will separate them.
                    </span>
                  </p>
                ) : null}

                <div className="mt-10 space-y-14">
                  {remainingBands.map((band) => (
                    <Band key={band.id} band={band} />
                  ))}
                </div>
              </Reveal>
            </section>

            <NextSteps />
          </>
        )}
      </Container>
    </>
  );
}

/**
 * One result with its full engine breakdown.
 *
 * Reuses `MatchBreakdown`, which is what the scholarship page renders, so the
 * explanation a student reads here and the one they read after tapping through
 * are the same component over the same data.
 */
function WhyThisMatches({ entry }: { entry: RankedScholarship }) {
  const { scholarship, match } = entry;

  return (
    <article className="surface-glass edge-highlight rounded-3xl p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-mist-50">{scholarship.title}</h3>
          <p className="mt-1.5 text-xs text-mist-500">
            {scholarship.organization} &middot; {scholarship.country} &middot;{" "}
            {scholarship.degreeLabel}
          </p>
        </div>

        <Badge tone={match.eligibility.isEligible ? "positive" : "caution"}>
          {match.eligibility.isEligible ? `${match.score}% match` : "Not eligible"}
        </Badge>
      </div>

      <div className="mt-6">
        <MatchBreakdown match={toMatchInsights(match)} />
      </div>

      {!match.eligibility.isEligible ? (
        <p className="mt-5 text-sm leading-relaxed text-rose-200">
          {match.eligibility.hardFailures.join(" and ")} requirement not met, so there
          is no application to make here.
        </p>
      ) : null}
    </article>
  );
}

/** One band heading plus its cards, reusing the explorer's grid. */
function Band({ band }: { band: RecommendationBand }) {
  const headingId = `band-${band.id}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h3
          id={headingId}
          className="font-display text-xl font-normal tracking-[-0.015em] text-mist-50 sm:text-2xl"
        >
          {band.title}
        </h3>

        <span className="text-xs text-mist-500">
          {band.entries.length} {band.entries.length === 1 ? "result" : "results"}
        </span>
      </div>

      <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-mist-400">
        {band.description}
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {band.entries.map((entry) => (
          <li key={entry.scholarship.id} className="h-full min-w-0">
            <ScholarshipCard
              scholarship={toPreview(entry.scholarship, toMatchInsights(entry.match))}
              href={detailHref(entry.scholarship.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Completion read-out and the specific fields still missing.
 *
 * The percentage comes from `profileCompletion`, which only counts fields the
 * engine acts on, so a high number always corresponds to a better ranking rather
 * than to more text entered.
 */
function ProfileProgress() {
  const { profile } = useProfile();
  const completion = profileCompletion(profile);
  const provisional = isProvisional(completion);

  return (
    <section aria-labelledby="profile-progress-heading" className="mt-10">
      <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="profile-progress-heading"
              className="font-display text-xl font-normal tracking-[-0.015em] text-mist-50"
            >
              Your profile is {completion.percent}% complete
            </h2>
            <p className="mt-1.5 text-sm text-mist-500">
              {completion.answeredCount} of {completion.fieldCount} fields the engine
              reads are answered.
            </p>
          </div>

          <Button href="/profile" size="sm" variant="secondary">
            Improve my matches
          </Button>
        </div>

        <div
          className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
          role="img"
          aria-label={`Profile ${completion.percent}% complete`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-azure-500 to-azure-300"
            style={{ width: `${completion.percent}%` }}
          />
        </div>

        {provisional ? (
          <p className="mt-5 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3.5 text-sm leading-relaxed text-mist-300">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
            <span>
              Scores below are damped because too little of your profile could be
              checked. Answering the fields below lifts the ceiling and sharpens the
              order.
            </span>
          </p>
        ) : null}

        {completion.gaps.length > 0 ? (
          <>
            <h3 className="mt-6 text-sm font-medium text-mist-100">
              What is holding your ranking back
            </h3>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {completion.gaps.slice(0, 6).map((gap) => (
                <li
                  key={gap.id}
                  className="rounded-xl border border-hairline-soft bg-white/[0.03] p-3.5"
                >
                  <p className="text-sm font-medium text-mist-100">{gap.label}</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-pretty text-mist-500">
                    {gap.reason}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-6 text-sm text-mist-400">
            Every field the engine reads is answered, so these scores are not damped.
          </p>
        )}
      </div>
    </section>
  );
}

/** Closing actions: keep researching, or improve the inputs behind the ranking. */
function NextSteps() {
  return (
    <div className="surface-glass mt-20 flex flex-wrap items-center justify-between gap-5 rounded-3xl p-6 sm:p-7">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-normal tracking-[-0.015em] text-mist-50">
          Want a different set?
        </h2>
        <p className="mt-1.5 max-w-md text-pretty text-sm text-mist-400">
          Filter by deadline, funding and country in the explorer, or change an answer
          and watch the ranking move.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button href="/scholarships" variant="secondary">
          Explore all scholarships
        </Button>
        <Button href="/profile">Update my profile</Button>
      </div>
    </div>
  );
}

/**
 * No profile yet.
 *
 * Leads with onboarding rather than a ranking built from an empty profile, because
 * ranking against nothing produces confidently ordered results that mean nothing.
 */
function EmptyProfileState() {
  return (
    <div className="surface-glass edge-highlight relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-azure-400/10 blur-3xl"
      />

      <div className="relative">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-hairline bg-white/[0.04]">
          <UserRound className="size-6 text-mist-400" aria-hidden="true" />
        </span>

        <h2 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl">
          Your matches start with your profile
        </h2>

        <p className="mx-auto mt-3 max-w-md text-pretty text-mist-400">
          There is nothing to rank yet. Answer the short profile and every
          opportunity in the collection gets scored against your own academics,
          eligibility and preferences.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/profile">Build my profile</Button>
          <Button href="/scholarships" variant="secondary">
            Browse all scholarships
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Stored profile that could not be parsed.
 *
 * `parseProfile` rejects unknown schema versions and sections that fail
 * validation, so this covers hand-edited storage as well as data left by another
 * build. The stored value is left untouched until the visitor chooses to replace
 * it, so nothing is destroyed by rendering the page.
 */
function UnreadableProfileState() {
  return (
    <div className="surface-glass edge-highlight relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div className="relative" role="alert">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-hairline bg-white/[0.04]">
          <Compass className="size-6 text-amber-300" aria-hidden="true" />
        </span>

        <h2 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl">
          We could not read your saved profile
        </h2>

        <p className="mx-auto mt-3 max-w-md text-pretty text-mist-400">
          Something in the profile stored in this browser is not in a shape we
          recognise, usually because it was edited by hand or written by a newer
          version. Rebuilding replaces it, so do that only if you are happy to
          re-enter your answers.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/profile">Rebuild my profile</Button>
          <Button href="/scholarships" variant="secondary">
            Browse all scholarships
          </Button>
        </div>
      </div>
    </div>
  );
}