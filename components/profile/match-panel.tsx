"use client";

import Link from "next/link";
import { useMemo } from "react";

import { StatusBar } from "@/components/scholarships/detail/status-bar";
import { Badge } from "@/components/ui/badge";
import { MatchRing } from "@/components/ui/match-ring";
import { matchTone } from "@/lib/format";
import { MATCH_QUALITY_LABELS, rankScholarships, toMatchInsights, topMatches } from "@/lib/matching";
import { allScholarships, toPreview } from "@/lib/scholarships";

import type { RankedScholarship } from "@/types/matching";
import type { StudentProfile } from "@/types/student";

/**
 * Live match panel.
 *
 * Renders the result of running the real engine over the visitor's profile
 * against the real records. There is no second scoring path for this panel: the
 * numbers here come from `rankScholarships`, which is also what orders the
 * explorer.
 *
 * Because the engine is pure and synchronous, this needs no effect, no fetch and
 * no loading state, so a score cannot flash from one value to another.
 */
export function MatchPanel({
  results,
  isHydrated,
}: {
  /** Ranked results supplied by the caller, which owns the record list. */
  results: readonly RankedScholarship[];
  /** False until stored state has been read, so the panel can hold back. */
  isHydrated: boolean;
}) {
  const top = useMemo(() => results.slice(0, 5), [results]);

  if (!isHydrated) {
    return (
      <div className="surface-glass edge-highlight rounded-2xl p-6" aria-busy="true">
        <p className="text-sm text-mist-500">Loading your saved profile.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="surface-glass edge-highlight rounded-2xl p-6">
        <h2 className="font-display text-xl text-mist-50">Your matches</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist-400">
          No opportunities to score yet.
        </p>
      </div>
    );
  }

  const eligible = results.filter((entry) => entry.match.eligibility.isEligible);
  const best = results[0];
  const unknownCount = results.filter((entry) => entry.match.missingInformation.length > 0).length;

  return (
    <div className="surface-glass edge-highlight rounded-2xl p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-mist-50">Your matches</h2>
          <p className="mt-1.5 text-sm text-mist-500">
            {eligible.length} of {results.length} eligible
          </p>
        </div>

        {best !== undefined && best.match.eligibility.isEligible ? (
          <div className="flex flex-col items-center gap-2">
            <MatchRing score={best.match.score} size="sm" label="Best match" />
            <Badge tone={matchTone(best.match.score)}>
              {MATCH_QUALITY_LABELS[best.match.quality]}
            </Badge>
          </div>
        ) : null}
      </div>

      {unknownCount > 0 ? (
        <p className="mt-5 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3.5 text-sm leading-relaxed text-mist-300">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
          <span>
            {unknownCount} result{unknownCount === 1 ? " is" : "s are"} based on partial
            information. Answer more above and these will sharpen.
          </span>
        </p>
      ) : null}

      <ol className="mt-5 space-y-3">
        {top.map((entry) => (
          <ResultRow key={entry.scholarship.id} entry={entry} />
        ))}
      </ol>

      {/*
        Two destinations, deliberately: `/matches` is the personalised route
        built from these stored answers, while the explorer is the full
        filterable collection. Merging them would blur a ranking the student
        cannot change with one they can.
      */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 text-sm font-medium text-mist-100 transition-colors duration-200 hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
        >
          See my matches
          <svg
            className="size-3.5"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 6h7M6.5 3l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <Link
          href="/scholarships"
          className="text-sm text-mist-400 transition-colors duration-200 hover:text-mist-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
        >
          Explore all {results.length} opportunities
        </Link>
      </div>
    </div>
  );
}

/**
 * One ranked result.
 *
 * The score is read from `entry.match`, never recomputed, and the detail link
 * resolves to the same score the detail page renders because both call the same
 * function with the same profile.
 */
function ResultRow({ entry }: { entry: RankedScholarship }) {
  const { scholarship, match } = entry;
  // Projected through the same adapter the detail page uses, so the funding and
  // deadline wording here cannot drift from the record page. `match` is already
  // computed, so it is passed in rather than rescored.
  const preview = toPreview(scholarship, toMatchInsights(match));

  return (
    <li className="rounded-xl border border-hairline-soft bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/scholarships/${scholarship.id}`}
            className="text-[0.9375rem] font-medium text-mist-100 transition-colors duration-200 hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
          >
            {scholarship.title}
          </Link>

          <p className="mt-1 text-xs text-mist-500">
            {scholarship.organization} &middot; {scholarship.country} &middot;{" "}
            {scholarship.fundingLabel}
          </p>
        </div>

        <Badge tone={matchTone(match.score)}>{match.score}%</Badge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-pretty text-mist-400">{match.summary}</p>

      {!match.eligibility.isEligible ? (
        <p className="mt-3 flex gap-2.5 text-xs leading-relaxed text-rose-200">
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-rose-400" aria-hidden="true" />
          {match.eligibility.hardFailures.join(" and ")} requirement not met.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {match.dimensions
            .filter((dimension) => dimension.status !== "not_specified")
            .map((dimension) => (
              <li key={dimension.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-mist-500">{dimension.label}</span>
                <StatusBar
                  label={dimension.label}
                  value={dimension.score}
                  status={dimension.status}
                />
              </li>
            ))}
        </ul>
      )}

      {match.missingInformation.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-mist-500">
          Add this to sharpen your score: {match.missingInformation[0]}
        </p>
      ) : null}

      <span className="sr-only">
        {preview.factors.length} scored dimensions across a {scholarship.degreeLabel} programme.
      </span>
    </li>
  );
}

/**
 * Scores a profile against the explorer collection.
 *
 * A thin wrapper so the page does not have to know how ranking is invoked, and so
 * the same call backs a server render and a client render identically.
 */
export function useProfileMatches(profile: StudentProfile): readonly RankedScholarship[] {
  // `allScholarships` is a static array reference, so it is a stable dependency.
  const records = allScholarships();
  return useMemo(() => rankScholarships(profile, records), [profile, records]);
}

/** The best matches for a profile, for surfaces that show a short list. */
export function profileTopMatches(
  profile: StudentProfile,
  limit: number,
): readonly RankedScholarship[] {
  return topMatches(profile, allScholarships(), limit);
}