/**
 * Projection from a full `Scholarship` record onto the compact card shape.
 *
 * Kept in its own module because both the demo fixtures and the explorer read
 * helpers need it, and importing it from the read helpers would create a cycle.
 */

import { QUERY_REFERENCE_DATE } from "@/lib/scholarships/query";
import type {
  EligibilityStatus,
  FundingTier,
  MatchInsights,
  Scholarship,
  ScholarshipPreview,
} from "@/types/scholarship";

/** Whole days from the shared reference date until the deadline. */
export function daysUntil(deadline: string): number {
  const reference = new Date(QUERY_REFERENCE_DATE);
  return Math.round((new Date(deadline).getTime() - reference.getTime()) / 86_400_000);
}

/**
 * Narrows the Phase 02 funding vocabulary onto Phase 01's four tiers.
 *
 * The two vocabularies differ on purpose: Phase 01 needed a single
 * fully-funded-versus-not distinction, while the explorer exposes the
 * components of a package.
 */
function toLegacyFunding(funding: FundingTier): ScholarshipPreview["funding"] {
  switch (funding) {
    case "fully_funded":
      return "fully_funded";
    case "stipend":
    case "research_funding":
      return "stipend";
    default:
      return "partial";
  }
}

/** Maps an evaluation outcome onto a 0-100 meter value. */
export function scoreForStatus(status: EligibilityStatus): number {
  switch (status) {
    case "strong_match":
      return 96;
    case "meets":
      return 82;
    case "review":
      return 58;
    case "not_eligible":
      return 12;
    default:
      return 40;
  }
}

/**
 * Reuses the match breakdown as meter factors so the existing `MatchMeter`
 * component can render engine output without a second data shape.
 */
function toFactors(match: MatchInsights): ScholarshipPreview["factors"] {
  return match.breakdown
    .filter((item) => item.status !== "not_specified")
    .map((item) => ({
      id: item.id,
      label: item.label,
      score: scoreForStatus(item.status),
    }));
}

/**
 * Projects a full record onto the compact shape cards render.
 *
 * Phase 01 authored `deadlineInDays` and `factors` by hand in its fixture. Both
 * are computed here instead so the explorer grid, the homepage showcase and the
 * detail hero can never disagree about the same opportunity.
 */
export function toPreview(scholarship: Scholarship): ScholarshipPreview {
  return {
    id: scholarship.id,
    title: scholarship.title,
    organization: scholarship.organization,
    country: scholarship.country,
    countryCode: scholarship.countryCode,
    degree: scholarship.degree,
    degreeLabel: scholarship.degreeLabel,
    fields: scholarship.fields,
    funding: toLegacyFunding(scholarship.funding),
    fundingLabel: scholarship.fundingLabel,
    deadline: scholarship.deadline,
    deadlineInDays: daysUntil(scholarship.deadline),
    matchScore: scholarship.match.score,
    tags: scholarship.tags,
    factors: toFactors(scholarship.match),
    reasons: scholarship.match.strengths.map((label, index) => ({
      id: `${scholarship.id}-strength-${index}`,
      label,
    })),
    requirements: [
      ...scholarship.match.missingRequirements.map((label, index) => ({
        id: `${scholarship.id}-missing-${index}`,
        label,
        hint: "Worth completing before you invest time in this application.",
      })),
      ...scholarship.match.warnings.map((label, index) => ({
        id: `${scholarship.id}-warning-${index}`,
        label,
        hint: "Worth reviewing before you invest time in this application.",
      })),
    ],
  };
}