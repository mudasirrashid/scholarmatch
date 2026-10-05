/**
 * Public surface of the matching engine.
 *
 * Everything outside `lib/matching` should import from here. The split between
 * `engine`, `rules` and `rank` is an implementation detail; the vocabulary
 * exported below is the contract the rest of the product codes against.
 */

export {
  matchScholarship,
  toMatchInsights,
  describeLanguageRequirement,
  evaluationCoverage,
  TOTAL_DIMENSION_WEIGHT,
} from "@/lib/matching/engine";
export { rankScholarships, topMatches } from "@/lib/matching/rank";
export {
  ACADEMIC_SCALE_CEILING,
  ACADEMIC_SCALE_FLOOR,
  normaliseGpa,
} from "@/lib/matching/academic";

export {
  CONFIDENCE_FLOOR_WEIGHT,
  CONFIDENCE_THRESHOLD,
  DIMENSION_WEIGHTS,
  HARD_DIMENSIONS,
  HARD_FAILURE_CAP,
  MATCH_QUALITY_LABELS,
  MATCH_QUALITY_THRESHOLDS,
  MIN_CONFIDENCE,
  matchQuality,
} from "@/lib/matching/weights";

export { knownFields, isKnownField, relateFields, relateToFields } from "@/lib/matching/fields";
export { languageTestLabel } from "@/lib/matching/eligibility";

export type { FieldRelation } from "@/lib/matching/fields";
export type {
  AcademicVerdict,
  DegreeVerdict,
  LanguageVerdict,
  TestOutcome,
} from "@/lib/matching/eligibility";