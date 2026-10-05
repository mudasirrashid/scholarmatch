/**
 * Eligibility rules for the matching engine.
 *
 * These functions evaluate the facts on a `Scholarship` record against a
 * `StudentProfile` and return the outcome as data. They hold no opinions about
 * presentation and perform no scoring: `lib/matching/engine.ts` consumes what
 * they return.
 *
 * Two conventions run through the file:
 *
 * - A requirement the profile does not answer is reported as `unknown`, never
 *   as a pass or a failure. The engine turns those into missing information.
 * - An empty field on a record means the award is open on that dimension, so it
 *   resolves to satisfied rather than being skipped.
 */

import type {
  DegreeLevel,
  GpaRequirement,
  LanguageTest,
  Scholarship,
} from "@/types/scholarship";
import type {
  StudentDegree,
  StudentLanguageTests,
  WorkAuthorization,
} from "@/types/student";

/** Degree levels a student profile may target. */
const STUDENT_DEGREES: ReadonlySet<StudentDegree> = new Set<StudentDegree>([
  "bachelors",
  "masters",
  "doctorate",
]);

/** Narrowing guard used where a `DegreeLevel` feeds a student-degree check. */
function asStudentDegree(level: DegreeLevel): StudentDegree | null {
  return STUDENT_DEGREES.has(level as StudentDegree) ? (level as StudentDegree) : null;
}

/** Degree progression, used to tell "one step up" from "a step sideways". */
const DEGREE_ORDER: Readonly<Record<StudentDegree, number>> = {
  bachelors: 1,
  masters: 2,
  doctorate: 3,
};

export type DegreeVerdict =
  | "exact"
  | "eligible_step_up"
  | "below_entry"
  | "overqualified"
  | "unknown";

/**
 * Whether the student can enter a programme at `level`.
 *
 * A bachelor's holder applying to a master's programme is the normal case and
 * counts as eligible. A doctorate-holder applying to a bachelor's programme is
 * not, because the entry requirement is not met.
 */
export function evaluateDegree(
  currentDegree: StudentDegree | undefined,
  preferredDegree: StudentDegree | undefined,
  awardLevels: readonly DegreeLevel[],
): DegreeVerdict {
  const targets = awardLevels
    .map(asStudentDegree)
    .filter((level): level is StudentDegree => level !== null);
  if (targets.length === 0) return "eligible_step_up";

  // What the student actually wants to study decides first; the degree they
  // hold only resolves ties when no preference was entered.
  const intent = preferredDegree ?? currentDegree;
  if (intent === undefined) return "unknown";

  if (targets.includes(intent)) return "exact";

  const intentRank = DEGREE_ORDER[intent];
  // Compare against the lowest level offered, not the first listed one. An award
  // listing [doctorate, masters] is still open to a bachelor's applicant via the
  // master's route, so ordering of the array must not change the verdict.
  const lowestOffered = targets.reduce(
    (lowest, level) => (DEGREE_ORDER[level] < DEGREE_ORDER[lowest] ? level : lowest),
    targets[0] as StudentDegree,
  );
  if (intentRank < DEGREE_ORDER[lowestOffered]) return "below_entry";

  // The intent is offered or above the entry floor, but the student holds a level
  // higher than anything the award covers, so there is nothing left to study.
  if (
    currentDegree !== undefined &&
    targets.every((level) => DEGREE_ORDER[level] < DEGREE_ORDER[currentDegree])
  ) {
    return "overqualified";
  }

  return "eligible_step_up";
}

export type AcademicVerdict = "exceeds" | "meets" | "close" | "below" | "no_requirement" | "unknown";

/**
 * Compares the student's GPA against the award's floor.
 *
 * `close` marks a shortfall small enough to be worth contacting the provider
 * about rather than a reason to walk away.
 */
export function evaluateAcademic(gpa: number | undefined, required: GpaRequirement): AcademicVerdict {
  if (required === 0) return "no_requirement";
  if (gpa === undefined) return "unknown";
  if (gpa >= required) return "exceeds";
  if (gpa >= required - 0.5) return "close";
  return "below";
}

/**
 * Nationality check.
 *
 * Reads the structured `eligibleCountries` field rather than the `nationality`
 * prose. That prose was authored for display and reads naturally
 * ("Open to students from low-income backgrounds", "Restricted to Nigerian
 * nationals"), which makes it unreliable to parse: capitalisation heuristics
 * mistake sentence-initial words for country names, and adjectival forms
 * ("Nigerian") never match a country name ("Nigeria").
 *
 * No demo record restricts eligibility by nationality, so `eligibleCountries` is
 * absent everywhere and every student resolves to `eligible`. The restricted
 * branch exists for real data, where the field is populated with ISO codes and
 * the comparison is exact.
 */
export function evaluateNationality(
  citizenship: string | undefined,
  eligibleCountries: readonly string[] | undefined,
): "eligible" | "restricted_match" | "restricted_mismatch" | "unknown" {
  // Absent or empty means open to all nationalities.
  if (eligibleCountries === undefined || eligibleCountries.length === 0) return "eligible";
  if (citizenship === undefined) return "unknown";

  return eligibleCountries.includes(citizenship)
    ? "restricted_match"
    : "restricted_mismatch";
}

/**
 * Whether the student's authorisation covers studying in the host country.
 *
 * `not_specified` is treated as unknown rather than as a refusal: providers that
 * do not care about status should not lose a student who has not answered yet.
 *
 * `hostCountryCode` is the record's ISO alpha-2 code, not its display name. The
 * two are different shapes ("NG" versus "Nigeria"), so comparing a profile's
 * citizenship against the country name can never match and would silently treat
 * every citizen as a foreign applicant needing a visa.
 */
export function evaluateWorkAuthorization(
  authorization: WorkAuthorization | undefined,
  hostCountryCode: string,
  citizenship: string | undefined,
): "satisfied" | "citizen_or_resident" | "needs_visa" | "not_satisfied" | "unknown" {
  // Being a citizen of the host country settles it, so this is checked before the
  // status field. A student who left status blank but recorded their citizenship
  // has told us enough: a citizen needs no visa to study in their own country.
  const isHostCitizen =
    citizenship !== undefined && citizenship.toUpperCase() === hostCountryCode.toUpperCase();
  if (isHostCitizen) return "citizen_or_resident";

  if (authorization === undefined || authorization === "not_specified") return "unknown";

  switch (authorization) {
    case "citizen":
    case "permanent_resident":
      // A citizen of somewhere else has no automatic right to study here, and a
      // permanent residence right is only valid in the country that granted it.
      return "needs_visa";
    case "student_visa":
    case "work_permit":
      return "needs_visa";
    case "no_right_to_work":
      return "not_satisfied";
  }
}

/** A student's score for one accepted test, compared to the published minimum. */
export interface TestOutcome {
  test: LanguageTest;
  required: number | undefined;
  actual: number | undefined;
  status: "meets" | "below" | "not_taken" | "no_threshold" | "not_accepted";
}

const LANGUAGE_TEST_LABEL: Readonly<Record<LanguageTest, string>> = {
  ielts: "IELTS",
  toefl: "TOEFL",
  duolingo: "Duolingo",
};

/** Display label for a test, e.g. "IELTS". */
export function languageTestLabel(test: LanguageTest): string {
  return LANGUAGE_TEST_LABEL[test];
}

/**
 * Evaluates every accepted language test.
 *
 * A test is only judged on a threshold the provider actually published. Where
 * none exists the outcome is `no_threshold`, which the engine reports as
 * "verify with the provider" rather than guessing a passing band.
 */
export function evaluateLanguageTests(
  scores: StudentLanguageTests,
  languageTests: readonly LanguageTest[],
  requirements: Scholarship["languageRequirements"],
): readonly TestOutcome[] {
  return languageTests.map((test) => {
    const required = requirements?.[test];
    const actual = scores[test];

    if (required === undefined) return { test, required, actual, status: "no_threshold" };
    if (actual === undefined) return { test, required, actual, status: "not_taken" };
    if (actual >= required) return { test, required, actual, status: "meets" };
    return { test, required, actual, status: "below" };
  });
}

/**
 * Full language evaluation for one profile and scholarship.
 *
 * Kept separate from `evaluateLanguageTests` so the profile plumbing happens
 * once here rather than at every call site.
 */
export function evaluateLanguage(
  tests: StudentLanguageTests | undefined,
  scholarship: Pick<Scholarship, "languageTests" | "languageRequirements" | "languageNote">,
): LanguageVerdict {
  if (scholarship.languageTests.length === 0) return "not_required";

  const outcomes = evaluateLanguageTests(tests ?? {}, scholarship.languageTests, scholarship.languageRequirements);
  const verdict = summariseLanguage(outcomes);

  // A provider that publishes a waiver has told us an alternative route exists,
  // so a missing or short score is a review item rather than a failure.
  if ((verdict === "unknown" || verdict === "unverified") && scholarship.languageNote !== undefined) {
    return "unverified";
  }

  return verdict;
}

export type LanguageVerdict = "not_required" | "meets" | "below" | "unverified" | "unknown";

/** Collapses per-test outcomes into one verdict for the language dimension. */
export function summariseLanguage(outcomes: readonly TestOutcome[]): LanguageVerdict {
  if (outcomes.length === 0) return "not_required";
  if (outcomes.some((outcome) => outcome.status === "meets")) return "meets";
  if (outcomes.some((outcome) => outcome.status === "below")) return "below";
  if (outcomes.some((outcome) => outcome.status === "not_taken")) return "unknown";
  return "unverified";
}