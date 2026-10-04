/**
 * ScholarMatch domain model.
 *
 * These shapes describe the vocabulary of the product rather than any specific
 * data source. Phase 01 renders them from static demo fixtures; later phases
 * will populate the same shapes from a real matching service, so the UI layer
 * should continue to depend on these types rather than on the fixtures.
 */

export type DegreeLevel =
  | "high_school"
  | "associate"
  | "bachelors"
  | "masters"
  | "doctorate"
  | "postdoctoral";

export type FundingType = "fully_funded" | "partial" | "tuition_only" | "stipend";

/** A single dimension the matcher evaluates, surfaced as a normalised score. */
export interface MatchFactor {
  /** Stable key, useful for icon lookup and analytics later. */
  id: string;
  /** Human-readable dimension name, e.g. "Academic". */
  label: string;
  /** Normalised score from 0 to 100. */
  score: number;
}

/** A reason the opportunity is a fit. */
export interface MatchReason {
  id: string;
  label: string;
}

/** A requirement the student does not yet satisfy. */
export interface MatchRequirement {
  id: string;
  label: string;
  /** Optional short remediation hint. */
  hint?: string;
}

/**
 * Read model for an opportunity as surfaced on discovery surfaces.
 *
 * `matchScore` is denormalised on purpose: list and card views need a single
 * ordering value without evaluating every factor.
 */
export interface ScholarshipPreview {
  id: string;
  title: string;
  /** Awarding body, e.g. a university or foundation. */
  organization: string;
  country: string;
  /** ISO 3166-1 alpha-2, used for the region affordance. */
  countryCode: string;
  degree: DegreeLevel;
  degreeLabel: string;
  funding: FundingType;
  fundingLabel: string;
  /** Whole days remaining until the closing date. Demo-only in Phase 01. */
  deadlineInDays: number;
  /** Overall fit score, 0 to 100. */
  matchScore: number;
  tags: readonly string[];
  factors: readonly MatchFactor[];
  reasons: readonly MatchReason[];
  requirements: readonly MatchRequirement[];
}

/**
 * Compact profile projection used by the hero visualisation.
 *
 * Deliberately partial: the hero only needs enough to explain the matching
 * concept without inventing personal data.
 */
export interface StudentProfilePreview {
  displayName: string;
  degreeLabel: string;
  fieldLabel: string;
  institutionLabel: string;
  /** Locale tags the student has declared. */
  languages: readonly string[];
  /** Normalised academic standing, 0 to 100. */
  academicScore: number;
}

/** Ordered product capability, presented in the feature showcase. */
export interface FeatureBlock {
  id: string;
  /** Two-digit display index, e.g. "01". */
  index: string;
  title: string;
  description: string;
  /** Points of elaboration shown beneath the description. */
  highlights: readonly string[];
}

/** A stage in the end-to-end student journey. */
export type JourneyStageId =
  | "discover"
  | "check"
  | "prepare"
  | "apply"
  | "track";

export interface JourneyStage {
  id: JourneyStageId;
  label: string;
  description: string;
}