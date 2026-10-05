/**
 * Grouping ranked results into the bands the personalised surfaces show.
 *
 * The bands are a *projection* of what the engine already decided, not a second
 * opinion. Every entry here is derived from fields `matchScholarship` produced:
 * `eligibility.isEligible` for the blocking decision and `quality` for the fit
 * band. Nothing here scores, re-weights or reorders anything, so adding a band
 * can never change a score.
 *
 * Ranking itself stays in `rank.ts`. This module only reshapes an already-ranked
 * list into sections, which is why it takes `RankedScholarship[]` rather than a
 * profile and a record list.
 */

import type { MatchQuality, RankedScholarship } from "@/types/matching";

/**
 * Bands, in the order they are presented.
 *
 * `blocked` is last on purpose: a student should read what they can apply to
 * first. It is still shown, because "you are not eligible yet, and here is
 * exactly which requirement you fail" is more useful than a silent omission.
 */
export type RecommendationBandId = "strong" | "good" | "potential" | "blocked";

export interface RecommendationBand {
  id: RecommendationBandId;
  /** Heading copy for the section. */
  title: string;
  /** One line explaining why these results are in this band. */
  description: string;
  /** Results in this band, keeping the order `rankScholarships` produced. */
  entries: readonly RankedScholarship[];
}

export interface RecommendationGroups {
  bands: readonly RecommendationBand[];
  /** Every entry, once, in the order it appeared in the ranking. */
  ordered: readonly RankedScholarship[];
  eligibleCount: number;
  blockedCount: number;
  /** Results carrying at least one unresolved profile field. */
  provisionalCount: number;
}

/** Eligible results keep the engine's own quality band. */
const ELIGIBLE_BANDS: readonly (readonly [MatchQuality, RecommendationBandId])[] = [
  ["strong", "strong"],
  ["good", "good"],
  ["potential", "potential"],
  ["weak", "potential"],
];

const BAND_COPY: Readonly<
  Record<RecommendationBandId, { title: string; description: string }>
> = {
  strong: {
    title: "Strong matches",
    description:
      "Every hard requirement is met from your profile, and the fit is close across your field and level.",
  },
  good: {
    title: "Good matches",
    description:
      "You are eligible and the fit is solid. Worth reading the requirements before you invest time.",
  },
  potential: {
    title: "Potential matches",
    description:
      "Eligible, but either a soft dimension is weaker than the rest or the profile is too thin to judge it properly. The breakdown for each result shows which.",
  },
  blocked: {
    title: "Not eligible yet",
    description:
      "A hard requirement is not met, so there is no application to make. Each entry names the requirement that blocks it.",
  },
};

/**
 * Picks the band for one result.
 *
 * Eligibility is checked first and short-circuits, because an ineligible result
 * has its score capped below the `potential` threshold anyway and would
 * otherwise be mislabelled as a weak fit.
 */
function bandFor(entry: RankedScholarship): RecommendationBandId {
  if (!entry.match.eligibility.isEligible) return "blocked";

  for (const [quality, band] of ELIGIBLE_BANDS) {
    if (entry.match.quality === quality) return band;
  }

  return "potential";
}

/**
 * Splits a ranking into presentation bands, dropping bands that are empty.
 *
 * Pure and order-preserving, so the strongest result of the whole ranking is
 * always the first thing shown no matter which bands are populated.
 */
export function groupRecommendations(
  ranked: readonly RankedScholarship[],
): RecommendationGroups {
  const collected = new Map<RecommendationBandId, RankedScholarship[]>();

  for (const entry of ranked) {
    const id = bandFor(entry);
    const bucket = collected.get(id);
    if (bucket === undefined) collected.set(id, [entry]);
    else bucket.push(entry);
  }

  const bands: RecommendationBand[] = (["strong", "good", "potential", "blocked"] as const)
    .filter((id) => (collected.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      title: BAND_COPY[id].title,
      description: BAND_COPY[id].description,
      entries: collected.get(id) ?? [],
    }));

  return {
    bands,
    ordered: ranked,
    eligibleCount: ranked.filter((entry) => entry.match.eligibility.isEligible).length,
    blockedCount: ranked.filter((entry) => !entry.match.eligibility.isEligible).length,
    provisionalCount: ranked.filter((entry) => entry.match.missingInformation.length > 0).length,
  };
}