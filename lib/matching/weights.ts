/**
 * Weighting for the matching engine.
 *
 * Every number the engine uses to turn profile facts into a score lives here.
 * Centralising them is what makes a score defensible: a reviewer can read this
 * file and reproduce any score the product shows, and changing the product's
 * attitude toward, say, funding preference is a one-line edit rather than a
 * hunt through the codebase.
 *
 * Dimension weights sum to 1 and cover every dimension in `MatchDimensionId`.
 */

import type { MatchDimensionId, MatchQuality } from "@/types/matching";

/**
 * Share of the overall score carried by each dimension.
 *
 * Academic standing and subject fit dominate because they are the two things a
 * provider is least likely to waive. The remainder is split across the
 * dimensions that shape whether applying is worthwhile rather than whether it
 * is permitted.
 */
export const DIMENSION_WEIGHTS: Readonly<Record<MatchDimensionId, number>> = {
  academic: 0.3,
  field: 0.25,
  degree: 0.15,
  eligibility: 0.15,
  experience: 0.05,
  preferences: 0.1,
};

/** Dimensions whose failure blocks an application outright. */
export const HARD_DIMENSIONS: ReadonlySet<MatchDimensionId> = new Set<MatchDimensionId>([
  "academic",
  "degree",
  "eligibility",
]);

/**
 * Share of total weight a profile must answer for the score to stand unadjusted.
 *
 * Re-weighting over the dimensions we could evaluate stops an incomplete profile
 * being punished twice, but taken alone it lets a near-empty profile post a
 * flattering score: with only the degree dimension known, a student can look like
 * a 70% match on nothing else being checked.
 *
 * So the weighted result is damped by how much of the profile actually
 * contributed, floored at `MIN_CONFIDENCE` so a nearly blank profile is not
 * driven to zero either. The remaining uncertainty is always reported in
 * `missingInformation`, and the summary says the score is provisional.
 */
export const CONFIDENCE_FLOOR_WEIGHT = 0.3;

/**
 * Fraction of evaluable weight required before a score is presented as settled.
 *
 * Below this, the score is damped toward the confidence floor in proportion to
 * what is still unknown.
 */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Lowest multiplier an incomplete profile can be damped to. */
export const MIN_CONFIDENCE = 0.4;

/**
 * Score ceiling applied when any hard dimension fails.
 *
 * A student who cannot apply should never see a high match score, and should
 * never sort above an eligible option. The cap sits below the `potential`
 * threshold so ineligible results also read as poor matches.
 */
export const HARD_FAILURE_CAP = 45;

/**
 * Score floors for each quality band, highest first.
 *
 * One definition, imported by the engine, the ranking and every consumer of a
 * match label. Phase 02 could not do this because authored scores had no bands.
 */
export const MATCH_QUALITY_THRESHOLDS: readonly (readonly [number, MatchQuality])[] = [
  [85, "strong"],
  [70, "good"],
  [55, "potential"],
];

/** Labels shown next to a quality band. */
export const MATCH_QUALITY_LABELS: Readonly<Record<MatchQuality, string>> = {
  strong: "Strong match",
  good: "Good match",
  potential: "Potential match",
  weak: "Weak match",
};

/** Resolves a numeric score to its band. Any score at or below 0 is `weak`. */
export function matchQuality(score: number): MatchQuality {
  for (const [minimum, quality] of MATCH_QUALITY_THRESHOLDS) {
    if (score >= minimum) return quality;
  }
  return "weak";
}

/** Maps a dimension score to the status the existing UI already renders. */
export const DIMENSION_STATUS_THRESHOLDS: readonly (readonly [number, "strong_match" | "meets" | "review"])[] =
  [
    [90, "strong_match"],
    [70, "meets"],
    [50, "review"],
  ];