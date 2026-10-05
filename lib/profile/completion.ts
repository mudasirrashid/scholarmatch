/**
 * Profile completion.
 *
 * Phase 04 needs to tell a student two things they cannot infer from a score:
 * how much of what the engine actually reads has been answered, and which
 * unanswered fields are holding their ranking back. Both come from here so the
 * percentage shown in the UI is a calculation rather than a decorative number.
 *
 * ## Why this is not `evaluationCoverage`
 *
 * `evaluationCoverage` in `lib/matching` measures how much of *one match
 * result* was decidable for a *one record*. Completion answers a different
 * question about the *profile as a whole*, so it is computed here from the
 * profile rather than read off a match. Keeping them apart means the engine is
 * untouched and neither number has to pretend to be the other.
 *
 * ## Field set
 *
 * The fields below are the profile inputs the engine can act on. Fields that
 * never change a score (display name, university, career goal, start date) are
 * excluded: counting them would let a student reach "complete" without having
 * answered anything that affects their ranking, which would make the percentage
 * a lie.
 *
 * The weights are intentionally independent of `DIMENSION_WEIGHTS`. That constant
 * scales a match score, where an unanswered field is damped rather than absent.
 * Here an unanswered field is missing outright, so the hard dimensions dominate:
 * an unknown degree level or work authorisation weakens every result at once,
 * while an unknown study mode only changes the preferences dimension.
 */

import { isKnownField } from "@/lib/matching";

import type { StudentProfile } from "@/types/student";

/** One thing the profile can be missing, with where to go and why it matters. */
export interface CompletionGap {
  /** Engine-facing field key, matching `MISSING_INFORMATION_HINTS`. */
  id: string;
  /** Field label as the student sees it in the builder. */
  label: string;
  /** Profile section that owns the field. */
  section: "academic" | "eligibility" | "experience" | "preferences";
  /** What the answer changes, in the student's terms. */
  reason: string;
  /** Share of the total this field is worth. */
  weight: number;
  /** Same distinction as `CompletionField.tier`, for the gap list. */
  tier: CompletionTier;
}

/** A completion gap paired with whether the profile already answers it. */
export interface CompletionField {
  id: string;
  label: string;
  section: CompletionGap["section"];
  weight: number;
  isAnswered: boolean;
  /**
   * Whether the ranking depends on this field or merely sharpens.
   *
   * `essential` fields gate eligibility, so leaving them blank caps the
   * confidence on every result at once. `helpful` fields only reorder results,
   * and a profile can be missing all of them and still be worth reading. The
   * distinction is surfaced so "complete" cannot be reached by answering only the
   * easy questions.
   */
  tier: CompletionTier;
}

export type CompletionTier = "essential" | "helpful";

export interface ProfileCompletion {
  /** Whole-number percentage, 0 to 100. */
  percent: number;
  /** The same figure before rounding, so tests and bars agree. */
  ratio: number;
  /** Weighted points earned out of the possible total. */
  earned: number;
  /** Total possible points. */
  total: number;
  /** Fields answered and unweighted, for "3 of 8 answered" style copy. */
  answeredCount: number;
  fieldCount: number;
  /** Essential fields answered, of `essentialTotal`. */
  essentialAnswered: number;
  essentialTotal: number;
  /** Every field the engine reads, in builder order. */
  fields: readonly CompletionField[];
  /** Unanswered fields, highest impact first. */
  gaps: readonly CompletionGap[];
  /**
   * True when the profile carries enough for the engine to judge eligibility at
   * all. Below this the results exist but no hard requirement can be decided, so
   * the UI leads with onboarding instead of a ranking.
   */
  isMeaningful: boolean;
}

/**
 * Fields that must be answered before a ranking is worth reading.
 *
 * The three hard dimensions, in the order a student should be pointed at them.
 * Kept as an explicit list rather than derived from `HARD_DIMENSIONS` because
 * `academic` covers two fields here (degree level and GPA) and the ordering is
 * a product decision, not an engine one.
 */
const CORE_FIELDS = ["currentDegree", "gpa", "citizenship", "workAuthorization"] as const;

/**
 * Membership test for the essential tier.
 *
 * Derived from `CORE_FIELDS` so the tier a field is given in the UI cannot drift
 * away from the set that decides whether results are meaningful.
 */
const ESSENTIAL_IDS: ReadonlySet<string> = new Set<string>(CORE_FIELDS);

/**
 * Which tier a field id belongs to.
 *
 * A named function rather than an inline ternary so both the field list and the
 * gap list read the tier the same way, and the returned type stays narrow.
 */
function tierOf(id: string): CompletionTier {
  return ESSENTIAL_IDS.has(id) ? "essential" : "helpful";
}

/**
 * The profile fields the engine acts on, with the weight each one carries.
 *
 * Weights are intentionally independent of `DIMENSION_WEIGHTS`. That constant
 * scales a match score, where an unanswered field is damped rather than absent.
 * Here an unanswered field is missing outright, so the hard dimensions dominate:
 * an unknown degree level or work authorisation weakens every result at once,
 * while an unknown study mode only changes the preferences dimension.
 */
const PROFILE_FIELDS: readonly {
  id: string;
  label: string;
  section: CompletionGap["section"];
  weight: number;
  reason: string;
  isAnswered: (profile: StudentProfile) => boolean;
}[] = [
  {
    id: "currentDegree",
    label: "Degree you are completing",
    section: "academic",
    // A hard dimension: without it the degree dimension is undecidable, which
    // caps the confidence on every single result rather than one of them.
    weight: 3,
    reason: "Decides which programmes you are eligible for.",
    isAnswered: (profile) => profile.academic?.currentDegree !== undefined,
  },
  {
    id: "gpa",
    label: "GPA",
    section: "academic",
    weight: 3,
    reason: "Checks you against academic floors and GPA cut-offs.",
    isAnswered: (profile) => profile.academic?.gpa !== undefined,
  },
  {
    id: "citizenship",
    label: "Citizenship",
    section: "eligibility",
    weight: 3,
    reason: "Residency and open-nationality rules depend on it.",
    isAnswered: (profile) => profile.eligibility?.citizenship !== undefined,
  },
  {
    id: "workAuthorization",
    label: "Work authorisation",
    section: "eligibility",
    weight: 3,
    reason: "Decides whether you can study in the host country.",
    isAnswered: (profile) => profile.eligibility?.workAuthorization !== undefined,
  },
  {
    id: "fieldOfStudy",
    label: "Field of study",
    section: "academic",
    weight: 2,
    reason: "Subject-fit scoring needs a field to compare.",
    isAnswered: (profile) => {
      const field = profile.academic?.fieldOfStudy;
      return field !== undefined && isKnownField(field);
    },
  },
  {
    id: "preferredDegree",
    label: "Degree you want to study towards",
    section: "preferences",
    weight: 2,
    reason: "Separates programmes you can join from ones you are aiming at.",
    isAnswered: (profile) => profile.preferences?.preferredDegree !== undefined,
  },
  {
    id: "languageTests",
    label: "Language test scores",
    section: "eligibility",
    weight: 2,
    reason: "Language requirements are left unchecked without a score.",
    isAnswered: (profile) => {
      const tests = profile.eligibility?.languageTests;
      if (tests === undefined) return false;
      return tests.ielts !== undefined || tests.toefl !== undefined || tests.duolingo !== undefined;
    },
  },
  {
    id: "preferredCountries",
    label: "Preferred destinations",
    section: "preferences",
    weight: 1,
    reason: "Factors location into your ranking.",
    isAnswered: (profile) => {
      const countries = profile.preferences?.preferredCountries;
      // An empty array is a known answer of "none in particular", so it counts.
      return countries !== undefined && countries.length > 0;
    },
  },
  {
    id: "workExperienceYears",
    label: "Work experience",
    section: "experience",
    weight: 1,
    reason: "Some practical requirements only apply with work history.",
    // `0` is a real answer here, which is why this is an inequality on
    // `undefined` rather than a truthiness check.
    isAnswered: (profile) => profile.experience?.workExperienceYears !== undefined,
  },
  {
    id: "researchExperienceYears",
    label: "Research experience",
    section: "experience",
    weight: 1,
    reason: "Research-track awards are ranked on it.",
    isAnswered: (profile) => profile.experience?.researchExperienceYears !== undefined,
  },
  {
    id: "fundingPreference",
    label: "Funding preference",
    section: "preferences",
    weight: 1,
    reason: "Separates fully funded awards from partial ones.",
    isAnswered: (profile) => profile.preferences?.fundingPreference !== undefined,
  },
  {
    id: "studyMode",
    label: "Preferred study mode",
    section: "preferences",
    weight: 1,
    reason: "Separates in-person awards from online ones.",
    isAnswered: (profile) => profile.preferences?.studyMode !== undefined,
  },
];

/**
 * Percentage below which results are presented as provisional.
 *
 * Roughly one hard dimension answered, so the UI can lead with "finish your
 * profile" while still showing whatever the engine could decide.
 */
export const PROVISIONAL_COMPLETION_PERCENT = 40;

/**
 * Scores how much of the matching-relevant profile is answered.
 *
 * Pure: the same profile always produces the same percentage, so the number in
 * the UI, the number on the progress bar and the number in a test cannot drift
 * apart.
 */
export function profileCompletion(profile: StudentProfile): ProfileCompletion {
  const fields: CompletionField[] = PROFILE_FIELDS.map((entry) => ({
    id: entry.id,
    label: entry.label,
    section: entry.section,
    weight: entry.weight,
    isAnswered: entry.isAnswered(profile),
    tier: tierOf(entry.id),
  }));

  const total = fields.reduce((sum, field) => sum + field.weight, 0);
  const earned = fields.reduce((sum, field) => sum + (field.isAnswered ? field.weight : 0), 0);

  const answeredCount = fields.filter((field) => field.isAnswered).length;

  const essential = fields.filter((field) => field.tier === "essential");
  const essentialAnswered = essential.filter((field) => field.isAnswered).length;

  const gaps: CompletionGap[] = PROFILE_FIELDS.filter((entry) => !entry.isAnswered(profile))
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      section: entry.section,
      reason: entry.reason,
      weight: entry.weight,
      tier: tierOf(entry.id),
    }))
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        Number(b.tier === "essential") - Number(a.tier === "essential") ||
        a.id.localeCompare(b.id),
    );

  const ratio = total === 0 ? 0 : earned / total;

  return {
    percent: Math.round(ratio * 100),
    ratio,
    earned,
    total,
    answeredCount,
    fieldCount: fields.length,
    essentialAnswered,
    essentialTotal: essential.length,
    fields,
    gaps,
    isMeaningful: CORE_FIELDS.every((id) => fields.find((field) => field.id === id)?.isAnswered === true),
  };
}

/** Whether results from this profile should be framed as provisional. */
export function isProvisional(completion: ProfileCompletion): boolean {
  return completion.percent < PROVISIONAL_COMPLETION_PERCENT;
}