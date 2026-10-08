"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { AlertTriangle, UserRound } from "lucide-react";

import { ProfileProvider, useProfile } from "@/components/profile/profile-provider";
import { MatchBreakdown } from "@/components/scholarships/detail/match-breakdown";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/ui/match-ring";
import { matchScholarship, toMatchInsights } from "@/lib/matching";
import { isProvisional, profileCompletion } from "@/lib/profile/completion";

import type { MatchInsights } from "@/types/scholarship";
import type { Scholarship } from "@/types/scholarship";
import type { ProfileCompletion } from "@/lib/profile/completion";
import type { MatchResult } from "@/types/matching";
import type { StudentProfile } from "@/types/student";

/**
 * The visitor's own match, on a scholarship detail page reached from `/matches`.
 *
 * The cards on `/matches` link here with `?mine=1`, which means "score this record
 * against my own profile". The detail route cannot act on that itself: reading
 * `searchParams` would take the route out of prerendering, and on this version of
 * Next.js an unknown id would then be answered by the framework's own error page
 * rather than by the styled 404 in `app/not-found.tsx`. So the route stays static
 * and the flag is read here, in the browser, instead.
 *
 * Until the flag is read, both placements render the sample-context markup they
 * render today, passed in as `fallback`. That is not only the server's view of
 * the world: the same markup is what a crawler or a visitor without JavaScript
 * sees, so it is the honest default rather than a placeholder for something else.
 * Because the switch happens in a layout effect, the sample figure is replaced
 * before the browser paints the personalised state.
 *
 * Nothing here scores differently. It is the same `matchScholarship` call the
 * ranking on `/matches` makes, against the profile this visitor actually stored,
 * which is what stops a card promising 62% and the page behind it promising 95%.
 */

/** `useLayoutEffect` on the client, `useEffect` on the server, which warns. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Query flag the cards on `/matches` attach. */
const PERSONALISED_FLAG = "mine";

interface PersonalisedValue {
  /** True once `?mine=1` has been read from the live URL. */
  requested: boolean;
  match: MatchInsights;
  completion: ProfileCompletion;
  provisional: boolean;
  /** The stored profile the evaluation was computed from. */
  profile: StudentProfile;
  /** The raw engine result, as produced by `matchScholarship`. */
  result: MatchResult;
}

const PersonalisedContext = createContext<PersonalisedValue | null>(null);

/** Whether the current URL asks for the visitor's own evaluation. */
function readsPersonalisedFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get(PERSONALISED_FLAG) === "1";
  } catch {
    return false;
  }
}

/**
 * Supplies the profile and, when asked for it, the evaluation of this record
 * against that profile.
 *
 * A single provider because the hero ring and the "Your match" section must never
 * disagree with each other; evaluating once and sharing the result keeps them in
 * lockstep and costs one pass over the engine. It also brings its own
 * `ProfileProvider` so callers have one wrapper to add rather than two.
 */
export function PersonalisedMatchProvider({
  scholarship,
  children,
}: {
  scholarship: Scholarship;
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <PersonalisedMatchContextProvider scholarship={scholarship}>
        {children}
      </PersonalisedMatchContextProvider>
    </ProfileProvider>
  );
}

function PersonalisedMatchContextProvider({
  scholarship,
  children,
}: {
  scholarship: Scholarship;
  children: React.ReactNode;
}) {
  const [requested, setRequested] = useState(false);
  const { profile } = useProfile();

  // A layout effect runs after hydration commits but before the browser paints,
  // so the personalised state replaces the sample figure in the same frame
  // rather than flashing a number that is about somebody else's answers.
  useIsomorphicLayoutEffect(() => {
    setRequested(readsPersonalisedFlag());
  }, []);

  const value = useMemo<PersonalisedValue>(() => {
    const completion = profileCompletion(profile);
    // Evaluated once and shared so the ring, the breakdown and the readiness
    // section all read the same engine result for the same profile.
    const result = matchScholarship(profile, scholarship);
    return {
      requested,
      completion,
      provisional: isProvisional(completion),
      profile,
      result,
      match: toMatchInsights(result),
    };
  }, [profile, scholarship, requested]);

  return (
    <PersonalisedContext.Provider value={value}>{children}</PersonalisedContext.Provider>
  );
}

/**
 * What a score placement can currently say.
 *
 * Derived once here rather than separately in each placement, so the ring, the
 * breakdown and the readiness section all agree on the state and adding one is
 * a single change.
 */
type MatchState =
  | { kind: "sample" }
  | { kind: "loading" }
  | { kind: "unreadable" }
  | { kind: "empty" }
  | { kind: "ready" } & Omit<PersonalisedValue, "requested">;

export function useMatchState(): MatchState {
  const { isHydrated, isUnreadable } = useProfile();
  const value = useContext(PersonalisedContext);

  if (!value) {
    throw new Error("useMatchState must be used inside a PersonalisedMatchProvider");
  }

  // Not asked for, so the sample context the route already renders stands.
  if (!value.requested) return { kind: "sample" };

  // Checked in this order: an unreadable key still exists, and reporting it as
  // "no profile" would send someone with saved answers back through onboarding.
  if (!isHydrated) return { kind: "loading" };
  if (isUnreadable) return { kind: "unreadable" };
  if (value.completion.answeredCount === 0) return { kind: "empty" };

  return {
    kind: "ready",
    match: value.match,
    completion: value.completion,
    provisional: value.provisional,
    profile: value.profile,
    result: value.result,
  };
}

/**
 * Placeholder matching the ring card's geometry, so the swap cannot reflow.
 *
 * Exported because the prerendered detail page needs the same card in its own
 * HTML for `?mine=1`: that route is served with the sample figure and only
 * discovers it should show the visitor's match after hydration, so the neutral
 * state has to already be on the page rather than appear one paint later.
 */
export function RingPlaceholder() {
  return (
    <div className="surface-glass edge-highlight relative rounded-3xl p-7 text-center">
      <div aria-hidden="true" className="shimmer mx-auto size-36 rounded-full" />
      <div aria-hidden="true" className="shimmer mx-auto mt-4 h-3 w-32 rounded-full" />
    </div>
  );
}

/**
 * Same silence on the numbers, same shape as the six breakdown tiles.
 *
 * Exported for the prerendered `?mine=1` detail page; see RingPlaceholder.
 */
export function BreakdownPlaceholder() {
  return (
    <div className="space-y-5">
      <div aria-hidden="true" className="shimmer h-4 w-3/4 rounded-full" />
      <div aria-hidden="true" className="shimmer h-4 w-1/2 rounded-full" />

      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} aria-hidden="true" className="shimmer h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Prompt for someone who asked for their own match but has no usable profile. */
export function NeedsProfile({ unreadable }: { unreadable: boolean }) {
  return (
    <div className="surface-glass edge-highlight rounded-3xl p-7 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-xl border border-hairline bg-tint/[0.04]">
        {unreadable ? (
          <AlertTriangle className="size-5 text-amber-300" aria-hidden="true" />
        ) : (
          <UserRound className="size-5 text-mist-400" aria-hidden="true" />
        )}
      </span>

      <p className="mt-4 font-display text-lg font-normal tracking-[-0.015em] text-mist-50">
        {unreadable ? "We could not read your saved profile" : "No saved profile yet"}
      </p>

      <p className="mx-auto mt-2 max-w-sm text-pretty text-[0.8125rem] leading-relaxed text-mist-400">
        {unreadable
          ? "The profile in this browser is not in a shape we recognise. Rebuilding replaces it, so only do that if you are happy to re-enter your answers."
          : "This page was asked to score the record against your own profile, and there are no answers in this browser yet, so nothing is being quoted here."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button href="/profile" size="sm">
          {unreadable ? "Rebuild my profile" : "Build my profile"}
        </Button>
        <Button href="/scholarships" size="sm" variant="secondary">
          Explore scholarships
        </Button>
      </div>
    </div>
  );
}

/**
 * Provenance for a personalised figure.
 *
 * States whose answers produced the number and how much of the profile was
 * available to produce it, because a damped score read differently from a final
 * one and should not be mistaken for it.
 */
function ScoredAgainst({
  completion,
  provisional,
}: {
  completion: ProfileCompletion;
  provisional: boolean;
}) {
  return (
    <p className="mt-3 text-[0.8125rem] leading-relaxed text-pretty text-mist-500">
      Scored against the {completion.percent}% complete profile saved in this browser.
      {provisional
        ? " That is little enough to check that the score is damped, so read it as a first look rather than a verdict."
        : ""}
    </p>
  );
}

/**
 * Hero placement.
 *
 * `fallback` is the sample-context card this route has always rendered, so the
 * server, a crawler and a visitor without JavaScript all get the same thing, and
 * a personalised view changes the number and its provenance and nothing about the
 * layout.
 */
export function PersonalisedMatchRing({ fallback }: { fallback: React.ReactNode }) {
  const state = useMatchState();

  if (state.kind === "sample") return <>{fallback}</>;

  if (state.kind === "loading") {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Reading your saved profile
        </span>
        <RingPlaceholder />
      </div>
    );
  }

  if (state.kind === "unreadable" || state.kind === "empty") {
    return <NeedsProfile unreadable={state.kind === "unreadable"} />;
  }

  return (
    <div className="surface-glass edge-highlight relative rounded-3xl p-7 text-center">
      <MatchRing score={state.match.score} size="lg" label="Overall match" />

      <p className="mt-4 max-w-[13rem] text-pretty text-[0.8125rem] text-mist-400">
        {state.match.summary}
      </p>

      <ScoredAgainst completion={state.completion} provisional={state.provisional} />
    </div>
  );
}

/**
 * "Your match" placement.
 *
 * The same `MatchBreakdown` over the visitor's own result, so the explanation is
 * the same component reading the same engine as everywhere else.
 */
export function PersonalisedMatchBreakdown({ fallback }: { fallback: React.ReactNode }) {
  const state = useMatchState();

  if (state.kind === "sample") return <>{fallback}</>;

  if (state.kind === "loading") {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Reading your saved profile
        </span>
        <BreakdownPlaceholder />
      </div>
    );
  }

  if (state.kind === "unreadable" || state.kind === "empty") {
    return <NeedsProfile unreadable={state.kind === "unreadable"} />;
  }

  const { match } = state;

  return (
    <div>
      <MatchBreakdown match={match} />

      {match.missingRequirements.length > 0 ? (
        <div className="surface-glass mt-6 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-mist-100">
            Still needed before you apply
          </h3>
          <ul className="mt-3 space-y-2">
            {match.missingRequirements.map((requirement) => (
              <li key={requirement} className="flex gap-2.5 text-sm text-mist-300">
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-amber-400"
                  aria-hidden="true"
                />
                {requirement}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-[0.8125rem] text-mist-500">
          Want a different answer to change this?
        </p>
        <Button href="/profile" size="sm" variant="secondary">
          Update my profile
        </Button>
        <Button href="/matches" size="sm" variant="secondary">
          Back to my matches
        </Button>
      </div>
    </div>
  );
}