/**
 * The matching engine.
 *
 * One pure function, `matchScholarship`, turns a profile plus a scholarship into
 * a `MatchResult`. Everything it decides is returned as data: the per-dimension
 * scores and verdicts, the eligibility outcome, and the human-readable
 * strengths, warnings and missing information.
 *
 * Two properties are deliberate:
 *
 * - **Deterministic.** No clock, randomness or hidden state. The same inputs
 *   always produce the same score, so a score can be reproduced from a profile
 *   snapshot and a record id.
 * - **Explainable.** Every dimension reports the verdict it reached and why, so
 *   the UI never has to invent a rationale for a number.
 */

import type {
  EligibilityStatus,
  MatchBreakdownItem,
  MatchInsights,
  Scholarship,
} from "@/types/scholarship";
import type {
  DimensionResult,
  MatchDimensionId,
  MatchResult,
  UnknownRequirement,
} from "@/types/matching";
import { MISSING_INFORMATION_HINTS } from "@/types/matching";
import type { StudentProfile } from "@/types/student";

import {
  evaluateAcademic,
  evaluateDegree,
  evaluateLanguage,
  evaluateNationality,
  evaluateWorkAuthorization,
  languageTestLabel,
  type AcademicVerdict,
  type DegreeVerdict,
  type LanguageVerdict,
} from "@/lib/matching/eligibility";
import { relateToFields, type FieldRelation } from "@/lib/matching/fields";
import {
  CONFIDENCE_FLOOR_WEIGHT,
  CONFIDENCE_THRESHOLD,
  DIMENSION_STATUS_THRESHOLDS,
  DIMENSION_WEIGHTS,
  HARD_DIMENSIONS,
  HARD_FAILURE_CAP,
  MATCH_QUALITY_LABELS,
  MIN_CONFIDENCE,
  matchQuality,
} from "@/lib/matching/weights";

/** Total of all dimension weights, asserted by `verify:matching`. */
export const TOTAL_DIMENSION_WEIGHT = Object.values(DIMENSION_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
);

/** Dimension id to display label, matching the wording Phase 02 already used. */
const DIMENSION_LABELS: Readonly<Record<MatchDimensionId, string>> = {
  academic: "Academic",
  field: "Field",
  degree: "Degree",
  eligibility: "Eligibility",
  experience: "Experience",
  preferences: "Preferences",
};

/** Maps a numeric dimension score to the status vocabulary the UI renders. */
function statusForScore(score: number, isHard: boolean): EligibilityStatus {
  if (isHard && score <= 0) return "not_eligible";
  for (const [minimum, status] of DIMENSION_STATUS_THRESHOLDS) {
    if (score >= minimum) return status;
  }
  return isHard ? "not_eligible" : "review";
}

/** Rounds to a whole number so displayed scores never wobble on decimals. */
function round(value: number): number {
  return Math.round(value);
}

/* ==========================================================================
   Dimension evaluators
   --------------------------------------------------------------------------
   Each returns a verdict, a 0-100 score, and an optional explanation. `score`
   is `null` when the profile does not contain enough information, which the
   caller reports as missing information rather than guessing.
   ========================================================================== */

interface Evaluation {
  verdict: string;
  score: number | null;
  detail?: string;
  /** Profile field that would resolve an unknown result. */
  needs?: keyof typeof MISSING_INFORMATION_HINTS;
  /** Overrides the generic missing hint when the default one misleads. */
  missing?: string;
}

function evaluateAcademicDimension(
  profile: StudentProfile,
  scholarship: Scholarship,
): Evaluation {
  const gpa = profile.academic?.gpa;
  const required = scholarship.gpa;

  /*
   * The provider publishes its own academic terms ("2:1", "upper third",
   * "minimum 70%") instead of a 4.0-scale number. Comparing a GPA against that
   * would be arithmetic on incompatible units, so the dimension reports that it
   * cannot be judged and asks the student to check their transcript against the
   * provider's own requirement — not to add a GPA they may already have given.
   */
  if (required === null) {
    return {
      verdict: "Provider sets its own bar",
      score: null,
      detail: `This provider publishes its own academic requirement: ${scholarship.gpaLabel}.`,
      missing: `Compare your transcript with this provider's own academic requirement (${scholarship.gpaLabel}) to see whether you clear it.`,
    };
  }

  if (gpa === undefined && required !== 0) {
    return { verdict: "Needs your GPA", score: null, detail: `This award asks for ${scholarship.gpaLabel}.`, needs: "gpa" };
  }

  const verdict: AcademicVerdict = evaluateAcademic(gpa, required);
  switch (verdict) {
    case "no_requirement":
      return { verdict: "No minimum listed", score: 100, detail: "No GPA floor is published for this award." };
    case "exceeds": {
      const headroom = Math.round(((gpa ?? 0) - required) * 20);
      return {
        verdict: "Above the floor",
        score: headroom >= 1 ? 100 : 96,
        detail: `Your GPA is ${(gpa ?? 0).toFixed(2)} against a ${scholarship.gpaLabel} minimum.`,
      };
    }
    case "meets":
      return { verdict: "Meets the minimum", score: 90, detail: `Your GPA meets the ${scholarship.gpaLabel} minimum.` };
    case "close":
      return {
        verdict: "Just below the floor",
        score: 55,
        detail: `You are ${(required - (gpa ?? 0)).toFixed(2)} points short of ${scholarship.gpaLabel}.`,
      };
    case "below":
      return {
        verdict: "Below the minimum",
        score: 0,
        detail: `This award needs ${scholarship.gpaLabel}; your GPA is ${(gpa ?? 0).toFixed(2)}.`,
      };
    case "unknown":
      return { verdict: "Needs your GPA", score: null, needs: "gpa" };
  }
}

function evaluateFieldDimension(profile: StudentProfile, scholarship: Scholarship): Evaluation {
  const field = profile.academic?.fieldOfStudy;
  if (field === undefined) {
    return {
      verdict: "Needs your field",
      score: null,
      detail: `This award covers ${scholarship.fields.join(", ") || "any field"}.`,
      needs: "field",
    };
  }

  const relation: FieldRelation = relateToFields(field, scholarship.fields);
  switch (relation) {
    case "exact":
      return { verdict: "Exact match", score: 100, detail: `${field} is listed for this award.` };
    case "related":
      return {
        verdict: "Related field",
        score: 78,
        detail: `${field} sits alongside ${scholarship.fields.join(" and ")} on this award.`,
      };
    case "unknown":
      return {
        verdict: "Field not recognised",
        score: 60,
        detail: `We could not place ${field} against ${scholarship.fields.join(", ")}. Check with the provider.`,
        needs: "field",
      };
    case "unrelated":
      return {
        verdict: "Different field",
        score: 20,
        detail: `This award is for ${scholarship.fields.join(", ")}, not ${field}.`,
      };
  }
}

function evaluateDegreeDimension(profile: StudentProfile, scholarship: Scholarship): Evaluation {
  const current = profile.academic?.currentDegree;
  const preferred = profile.preferences?.preferredDegree;
  const verdict: DegreeVerdict = evaluateDegree(current, preferred, scholarship.degreeLevels);

  switch (verdict) {
    case "exact":
      return {
        verdict: "Matches",
        score: 100,
        detail: `This award is open to ${scholarship.degreeLabel} study, which is your target.`,
      };
    case "eligible_step_up":
      return {
        verdict: "One step up",
        score: 88,
        detail: `You hold a ${current ?? "lower"} degree and this award is open to ${scholarship.degreeLabel} study.`,
      };
    case "below_entry":
      return {
        verdict: "Below the entry level",
        score: 0,
        detail: `This award expects ${scholarship.degreeLabel} entry; your current degree is below that.`,
      };
    case "overqualified":
      /*
       * Scored as a weak fit rather than a hard failure. Holding a doctorate does
       * not stop someone applying to a master's award, so reporting this as
       * "not eligible" would be a false statement about the provider's rules. It
       * lands on `review`, which surfaces as a warning and costs score without
       * capping the result as ineligible.
       */
      return {
        verdict: "Above this level",
        score: 50,
        detail: `You already hold a degree above this award's ${scholarship.degreeLabel} entry, so this is unlikely to be worth applying to.`,
      };
    case "unknown":
      return { verdict: "Needs your degree", score: null, needs: "preferredDegree" };
  }
}

function evaluateEligibilityDimension(
  profile: StudentProfile,
  scholarship: Scholarship,
): Evaluation & { unknown: readonly UnknownRequirement[] } {
  const unknown: UnknownRequirement[] = [];
  const parts: string[] = [];
  let score = 100;

  const nationality = evaluateNationality(
    profile.eligibility?.citizenship,
    scholarship.eligibleCountries,
    scholarship.excludedCountries,
  );
  switch (nationality) {
    case "eligible":
      parts.push("Open to your nationality");
      break;
    case "restricted_match":
      parts.push("Your citizenship is named as eligible");
      score = Math.min(score, 95);
      break;
    case "restricted_mismatch":
      score = 0;
      parts.unshift("This award is restricted to other nationalities");
      break;
    case "unknown":
      unknown.push({
        id: "citizenship",
        label: "Nationality",
        resolution: MISSING_INFORMATION_HINTS.citizenship,
      });
      parts.push("Nationality could not be checked");
      score = Math.min(score, 65);
      break;
  }

  const authorization = evaluateWorkAuthorization(
    profile.eligibility?.workAuthorization,
    scholarship.countryCode,
    profile.eligibility?.citizenship,
  );
  switch (authorization) {
    case "citizen_or_resident":
      parts.push("Your right to study here is already established");
      break;
    case "needs_visa":
      parts.push(`You would need a visa for ${scholarship.country}`);
      score = Math.min(score, 70);
      break;
    case "not_satisfied":
      score = 0;
      parts.unshift("Your work authorisation does not cover this destination");
      break;
    case "unknown":
      unknown.push({
        id: "workAuthorization",
        label: "Work authorisation",
        resolution: MISSING_INFORMATION_HINTS.workAuthorization,
      });
      score = Math.min(score, 70);
      break;
  }

  const language: LanguageVerdict = evaluateLanguage(
    profile.eligibility?.languageTests,
    scholarship,
  );
  switch (language) {
    case "not_required":
      parts.push("No language test required");
      break;
    case "meets":
      parts.push("Your language scores clear the published minimum");
      break;
    case "unverified":
      parts.push("Language evidence needs verifying with the provider");
      score = Math.min(score, 72);
      break;
    case "below":
      score = Math.min(score, 55);
      parts.push("Your language score is below the published minimum");
      break;
    case "unknown":
      unknown.push({
        id: "languageTests",
        label: "Language evidence",
        resolution: MISSING_INFORMATION_HINTS.languageTests,
      });
      score = Math.min(score, 70);
      break;
  }

  return { verdict: score === 100 ? "No barriers found" : "Check the details", score, detail: parts.join(". "), unknown };
}

/**
 * Scores practical and academic background.
 *
 * The demo records only demand portfolios, research or income evidence, and
 * never specify a number of years, so the engine rewards declared experience
 * without pretending to enforce a threshold it cannot see.
 */
function evaluateExperienceDimension(profile: StudentProfile, scholarship: Scholarship): Evaluation {
  const criteria = scholarship.eligibility;
  const demandsPortfolio = criteria.some((criterion) => criterion.id === "portfolio");
  const demandsResearch = criteria.some((criterion) => criterion.id === "research");
  const demandsIncome = criteria.some((criterion) => criterion.id === "income");

  const work = profile.experience?.workExperienceYears;
  const research = profile.experience?.researchExperienceYears;
  const leadership = profile.experience?.leadershipExperience;

  if (work === undefined && research === undefined && leadership === undefined) {
    return {
      verdict: "Needs your experience",
      score: null,
      needs: demandsResearch ? "researchExperience" : "workExperience",
    };
  }

  if (demandsResearch && research === undefined) {
    return {
      verdict: "Research evidence needed",
      score: 55,
      detail: "This award looks for research output you have not described yet.",
      needs: "researchExperience",
    };
  }

  if (demandsIncome) {
    return {
      verdict: "Means will be assessed",
      score: 62,
      detail: "Financial need is assessed as part of this award.",
    };
  }

  if (demandsPortfolio && (work ?? 0) === 0) {
    return {
      verdict: "Portfolio expected",
      score: 48,
      detail: "This award asks for a portfolio, and you have recorded no work experience.",
      needs: "workExperience",
    };
  }

  const strength = Math.min((work ?? 0), 5) + Math.min(research ?? 0, 5) + (leadership === true ? 2 : 0);
  if (strength === 0) return { verdict: "No experience recorded", score: 45 };
  return {
    verdict: "Solid background",
    score: Math.min(100, 62 + strength * 7),
    detail: "Your recorded experience supports this application.",
  };
}

/** Scores how well the award matches what the student is looking for. */
function evaluatePreferencesDimension(profile: StudentProfile, scholarship: Scholarship): Evaluation {
  const preferences = profile.preferences;
  if (preferences === undefined) {
    return { verdict: "Needs your preferences", score: null, needs: "fundingPreference" };
  }

  let score = 100;
  const notes: string[] = [];

  const funding = preferences.fundingPreference;
  if (funding !== undefined && funding !== "any") {
    const isFull = scholarship.funding === "fully_funded";
    if (funding === "fully_funded" && !isFull) {
      score -= 20;
      notes.push(`funding is ${scholarship.fundingLabel}, not fully funded`);
    } else if (funding === "partial" && isFull) {
      notes.push("funding exceeds what you need");
    }
  }

  const countries = preferences.preferredCountries;
  if (countries !== undefined && countries.length > 0) {
    if (countries.includes(scholarship.countryCode)) {
      notes.push(`located in your preferred destination`);
    } else {
      score -= 25;
      notes.push(`is in ${scholarship.country}, outside your preferred destinations`);
    }
  }

  const mode = preferences.studyMode;
  if (mode !== undefined && mode !== "any") {
    const onCampus = scholarship.studyMode.toLowerCase().includes("campus");
    if ((mode === "on_campus") === onCampus) {
      notes.push("matches your preferred study mode");
    } else {
      score -= 15;
      notes.push(`is delivered as ${scholarship.studyMode.toLowerCase()}`);
    }
  }

  if (score === 100) return { verdict: "Fits your preferences", score: 100 };
  return {
    verdict: score >= 75 ? "Mostly fits" : "Off-target",
    score,
    detail: notes.length > 0 ? `This award ${notes.join(", and ")}.` : undefined,
  };
}

/* ==========================================================================
   Result assembly
   ========================================================================== */

function buildDimension(
  id: MatchDimensionId,
  evaluation: Evaluation,
): DimensionResult {
  const isHard = HARD_DIMENSIONS.has(id);
  const weight = DIMENSION_WEIGHTS[id];
  const score = evaluation.score;

  return {
    id,
    label: DIMENSION_LABELS[id],
    isHard,
    status: score === null ? "not_specified" : statusForScore(score, isHard),
    score: score ?? 0,
    weight,
    verdict: evaluation.verdict,
    detail: evaluation.detail,
    missing: evaluation.missing,
  };
}

/**
 * How much of the profile the score is actually based on, 0 to 1.
 *
 * Returns the share of total dimension weight that produced an evaluation.
 */
function evaluatedWeight(dimensions: readonly DimensionResult[]): number {
  return dimensions
    .filter((dimension) => dimension.status !== "not_specified")
    .reduce((sum, dimension) => sum + dimension.weight, 0);
}

/** Share of the profile the score rests on, 0 to 1. Exported for diagnostics. */
export function evaluationCoverage(dimensions: readonly DimensionResult[]): number {
  return evaluatedWeight(dimensions) / TOTAL_DIMENSION_WEIGHT;
}

/**
 * Damping applied to a score computed from an incomplete profile.
 *
 * A full profile scores unadjusted. Below `CONFIDENCE_THRESHOLD` the multiplier
 * falls linearly toward `MIN_CONFIDENCE`, so two unknown dimensions out of six
 * barely move the number while an empty profile is clearly marked provisional
 * rather than quietly shown as an average match.
 */
function confidenceFactor(dimensions: readonly DimensionResult[]): number {
  const evaluated = evaluatedWeight(dimensions);
  if (evaluated >= CONFIDENCE_THRESHOLD) return 1;

  const span = CONFIDENCE_THRESHOLD - CONFIDENCE_FLOOR_WEIGHT;
  const shortfall = CONFIDENCE_THRESHOLD - evaluated;
  const proportion = Math.min(1, shortfall / span);
  return 1 - proportion * (1 - MIN_CONFIDENCE);
}

/** Weighted total across every dimension that could be evaluated. */
function weightedScore(dimensions: readonly DimensionResult[]): number {
  const evaluable = dimensions.filter((dimension) => dimension.status !== "not_specified");
  if (evaluable.length === 0) return 0;

  const total = evaluable.reduce(
    (sum, dimension) => sum + dimension.score * dimension.weight,
    0,
  );
  // Re-weight over the dimensions we could actually evaluate, so an incomplete
  // profile is not punished twice for being incomplete.
  const available = evaluable.reduce((sum, dimension) => sum + dimension.weight, 0);
  return (total / available) * confidenceFactor(dimensions);
}

function collectStrengths(dimensions: readonly DimensionResult[]): string[] {
  return dimensions
    .filter((dimension) => dimension.status === "strong_match" || dimension.status === "meets")
    .map((dimension) => {
      // Prefer the dimension's own explanation, because it carries the numbers
      // ("Your GPA is 3.80 against a 3.5+ minimum") that make a strength
      // credible rather than merely reassuring.
      const detail = dimension.detail;
      return detail === undefined
        ? `${dimension.label}: ${dimension.verdict}`
        : detail.charAt(0).toUpperCase() + detail.slice(1);
    })
    .slice(0, 4);
}

function collectWarnings(dimensions: readonly DimensionResult[]): string[] {
  return dimensions
    .filter(
      (dimension) =>
        dimension.status === "not_eligible" ||
        (dimension.status === "review" && !dimension.isHard),
    )
    .map((dimension) => dimension.detail ?? `${dimension.label}: ${dimension.verdict}`)
    .slice(0, 4);
}

function collectMissing(
  dimensions: readonly DimensionResult[],
  eligibilityUnknown: readonly UnknownRequirement[],
): string[] {
  const fromDimensions = dimensions
    .filter((dimension) => dimension.status === "not_specified")
    .map((dimension) => {
      // A dimension that knows why it could not decide says so itself; the
      // generic hint is only a fallback.
      const hint =
        dimension.missing ?? MISSING_INFORMATION_HINTS[missingKeyFor(dimension.id)];
      return hint ?? `${dimension.label} information would sharpen this score.`;
    });

  const fromEligibility = eligibilityUnknown.map((item) => item.resolution);
  return [...new Set([...fromDimensions, ...fromEligibility])].slice(0, 5);
}

/** Maps a dimension back to the hint key that describes its missing input. */
function missingKeyFor(id: MatchDimensionId): keyof typeof MISSING_INFORMATION_HINTS {
  switch (id) {
    case "academic":
      return "gpa";
    case "field":
      return "field";
    case "degree":
      return "preferredDegree";
    case "eligibility":
      return "workAuthorization";
    case "experience":
      return "workExperience";
    case "preferences":
      return "fundingPreference";
  }
}

/** One-line read on the score, written so it never overstates certainty. */
function buildSummary(
  quality: MatchResult["quality"],
  isEligible: boolean,
  dimensions: readonly DimensionResult[],
): string {
  const label = MATCH_QUALITY_LABELS[quality];

  if (!isEligible) {
    const failed = dimensions.find((dimension) => dimension.status === "not_eligible");
    return failed === undefined
      ? "A hard requirement is not met, so this is not a valid application."
      : `${failed.label}: ${failed.verdict.toLowerCase()}, so this is not a valid application.`;
  }

  const unknownCount = dimensions.filter((dimension) => dimension.status === "not_specified").length;
  if (unknownCount > 0) {
    return `${label}, with details still to confirm.`;
  }
  return `${label} based on your profile.`;
}

/**
 * Evaluates one profile against one scholarship.
 *
 * Pure and deterministic: identical inputs always yield an identical result,
 * including the order of every list returned.
 */
export function matchScholarship(
  profile: StudentProfile,
  scholarship: Scholarship,
): MatchResult {
  const academic = evaluateAcademicDimension(profile, scholarship);
  const field = evaluateFieldDimension(profile, scholarship);
  const degree = evaluateDegreeDimension(profile, scholarship);
  const eligibility = evaluateEligibilityDimension(profile, scholarship);
  const experience = evaluateExperienceDimension(profile, scholarship);
  const preferences = evaluatePreferencesDimension(profile, scholarship);

  const dimensions: DimensionResult[] = [
    buildDimension("academic", academic),
    buildDimension("field", field),
    buildDimension("degree", degree),
    buildDimension("eligibility", {
      verdict: eligibility.verdict,
      score: eligibility.score,
      detail: eligibility.detail,
    }),
    buildDimension("experience", experience),
    buildDimension("preferences", preferences),
  ];

  const hardFailures = dimensions
    .filter((dimension) => dimension.isHard && dimension.status === "not_eligible")
    .map((dimension) => dimension.label);

  const isEligible = hardFailures.length === 0;
  const raw = weightedScore(dimensions);
  const score = round(isEligible ? raw : Math.min(raw, HARD_FAILURE_CAP));
  const quality = matchQuality(score);

  return {
    scholarshipId: scholarship.id,
    score,
    quality,
    summary: buildSummary(quality, isEligible, dimensions),
    eligibility: {
      isEligible,
      hardFailures,
      softWarnings: collectWarnings(dimensions),
      unknownRequirements: eligibility.unknown,
    },
    dimensions,
    strengths: collectStrengths(dimensions),
    warnings: isEligible
      ? collectWarnings(dimensions)
      : hardFailures.map((label) => `${label} requirement is not met.`),
    missingInformation: collectMissing(dimensions, eligibility.unknown),
  };
}

/**
 * Projects engine output onto the `MatchInsights` shape Phase 02 already renders.
 *
 * This is the single seam between the engine and the existing UI. It maps the
 * six weighted dimensions onto the breakdown items the detail page shows, so no
 * component needs to learn the engine's vocabulary.
 */
export function toMatchInsights(match: MatchResult): MatchInsights {
  const breakdown: MatchBreakdownItem[] = match.dimensions.map((dimension) => ({
    id: dimension.id,
    label: dimension.label,
    verdict: dimension.verdict,
    status: dimension.status,
    detail: dimension.detail,
  }));

  const missing = match.missingInformation;
  return {
    score: match.score,
    summary: match.summary,
    breakdown,
    missingRequirements: missing,
    strengths: match.strengths,
    warnings: match.warnings,
  };
}

/** Human label for the language test a student still needs, used in warnings. */
export function describeLanguageRequirement(scholarship: Scholarship): string {
  const parts = scholarship.languageTests.map(
    (test) => `${languageTestLabel(test)} ${scholarship.languageRequirements?.[test] ?? ""}`.trim(),
  );
  return parts.join(" or ");
}