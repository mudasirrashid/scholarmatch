/**
 * Ranking scholarships for one profile.
 *
 * Ordering is a separate concern from scoring, and it is expressed as a sorted
 * comparator rather than as a score adjustment, so a rank can always be
 * explained by pointing at the criteria rather than at an opaque total.
 *
 * Criteria, in order:
 *
 * 1. **Eligibility.** An application the student cannot make always ranks below
 *    one they can, however high it otherwise scores.
 * 2. **Score.** The weighted match score, descending.
 * 3. **Missing information.** Fewer unknowns first, so a fully evaluated
 *    opportunity is preferred over an equally scored guess.
 * 4. **Deadline.** Soonest closing first, so actionable results surface.
 * 5. **Record id.** A stable tiebreak, so the same input always yields the same
 *    order regardless of the input array's order.
 */

import type { Scholarship } from "@/types/scholarship";
import type { MatchResult, RankedScholarship } from "@/types/matching";

import { matchScholarship } from "@/lib/matching/engine";

/** Compares two results. Negative means `a` ranks above `b`. */
function compare(a: MatchResult, b: MatchResult): number {
  if (a.eligibility.isEligible !== b.eligibility.isEligible) {
    return a.eligibility.isEligible ? -1 : 1;
  }
  if (a.score !== b.score) return b.score - a.score;

  const unknowns = a.missingInformation.length - b.missingInformation.length;
  if (unknowns !== 0) return unknowns;

  return 0;
}

/**
 * Ranks a set of scholarships for a profile.
 *
 * Pure: the same profile and the same input array always produce the same
 * ordering, including the `rank` field. Results already carrying a
 * `MatchResult` are reused rather than recomputed.
 */
export function rankScholarships(
  profile: Parameters<typeof matchScholarship>[0],
  scholarships: readonly Scholarship[],
): RankedScholarship[] {
  const ranked = scholarships
    .map((scholarship) => ({ scholarship, match: matchScholarship(profile, scholarship) }))
    .sort((left, right) => {
      const byMatch = compare(left.match, right.match);
      if (byMatch !== 0) return byMatch;

      // Deadline, then id, keep the order stable and reproducible.
      const byDeadline =
        new Date(left.scholarship.deadline).getTime() - new Date(right.scholarship.deadline).getTime();
      if (byDeadline !== 0) return byDeadline;

      return left.scholarship.id.localeCompare(right.scholarship.id);
    });

  return ranked.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** The strongest results, for surfaces that show a short "best for you" list. */
export function topMatches(
  profile: Parameters<typeof matchScholarship>[0],
  scholarships: readonly Scholarship[],
  limit: number,
): RankedScholarship[] {
  return rankScholarships(profile, scholarships).slice(0, limit);
}