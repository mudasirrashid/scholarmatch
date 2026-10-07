/**
 * Matching engine result types.
 *
 * These describe what the engine produced, as opposed to
 * `MatchInsights` in `types/scholarship.ts`, which is the flattened shape the
 * Phase 02 UI already renders. Keeping the two apart means the engine can stay
 * explicit and explainable while the presentation layer stays untouched;
 * `lib/matching/insights.ts` converts between them.
 *
 * Every engine function is pure: same profile plus same scholarship always
 * produces the same result, with no clock or randomness involved.
 */

import type { EligibilityStatus, Scholarship } from "@/types/scholarship";

/**
 * The dimensions the engine scores.
 *
 * `academic`, `degree` and `eligibility` are hard dimensions: failing one caps
 * the overall score and marks the result not eligible. The rest are soft and
 * only move the score.
 */
export type MatchDimensionId =
  | "academic"
  | "field"
  | "degree"
  | "eligibility"
  | "experience"
  | "preferences";

/** How well an opportunity is described overall, independent of any profile. */
export type MatchQuality = "strong" | "good" | "potential" | "weak";

/** Outcome of evaluating one dimension. */
export interface DimensionResult {
  id: MatchDimensionId;
  /** Display name, e.g. "Academic". */
  label: string;
  /** Whether the dimension gates the application. */
  isHard: boolean;
  status: EligibilityStatus;
  /** Normalised 0-100 contribution before weighting. */
  score: number;
  /** Share of the overall score this dimension carries, 0 to 1. */
  weight: number;
  /** Short verdict shown to the student. */
  verdict: string;
  /** One line explaining the verdict, present whenever the result needs it. */
  detail?: string;
  /**
   * What the student should do about this unknown, when the generic hint is
   * wrong for the reason the dimension failed.
   *
   * A record whose provider states its own academic terms, for example, needs
   * "compare your transcript with the provider's requirement", not "add your
   * GPA" — the GPA may already be there. `collectMissing` prefers this over
   * `MISSING_INFORMATION_HINTS` when both exist.
   */
  missing?: string;
}

/** Why a dimension could not be decided from the profile. */
export interface UnknownRequirement {
  id: string;
  label: string;
  /** What the student should add so this can be resolved. */
  resolution: string;
}

/** The eligibility verdict, separated from scoring so it can be shown on its own. */
export interface EligibilityResult {
  /** False when at least one hard requirement fails. */
  isEligible: boolean;
  /** Dimensions that fail a hard requirement. */
  hardFailures: readonly string[];
  /** Dimensions that pass but deserve a second look. */
  softWarnings: readonly string[];
  /** Requirements the profile does not contain enough information to judge. */
  unknownRequirements: readonly UnknownRequirement[];
}

/**
 * The complete evaluation of one profile against one scholarship.
 */
export interface MatchResult {
  scholarshipId: string;
  /** Overall fit, 0 to 100, already capped for hard failures. */
  score: number;
  quality: MatchQuality;
  /** One-line read on the score. */
  summary: string;
  eligibility: EligibilityResult;
  dimensions: readonly DimensionResult[];
  /** Reasons this opportunity stands out for this student. */
  strengths: readonly string[];
  /** Cautions to review before investing time. */
  warnings: readonly string[];
  /** Profile fields that would sharpen the score. */
  missingInformation: readonly string[];
}

/** A scholarship paired with its match result and position in the ranking. */
export interface RankedScholarship {
  scholarship: Scholarship;
  match: MatchResult;
  /** One-based position, counting every scholarship including ineligible ones. */
  rank: number;
}

/** Profile fields the engine would like, phrased for the student. */
export const MISSING_INFORMATION_HINTS = {
  gpa: "Add your GPA to confirm the academic floor.",
  field: "Add your field of study to check subject fit.",
  currentDegree: "Add the degree you are completing.",
  preferredDegree: "Add the degree level you want to study towards.",
  citizenship: "Add your citizenship to check residency rules.",
  workAuthorization: "Add your work authorisation to check eligibility in the host country.",
  languageTests: "Add your language test scores, or note that your degree was taught in English.",
  workExperience: "Add your work experience to see whether practical requirements affect this fit.",
  researchExperience: "Add your research experience for research-track awards.",
  preferredCountries: "Add your preferred destinations to factor location into your ranking.",
  fundingPreference: "Tell us how much of the cost you need covered.",
  studyMode: "Add your preferred study mode.",
} as const;