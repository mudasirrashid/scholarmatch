/**
 * Validation for profiles read out of `localStorage`.
 *
 * Stored JSON is user-writable: it can be hand-edited in devtools, left over from
 * an older schema, or written by a future version of the app. The matching engine
 * trusts its input, so anything that reaches it has to be a real profile first.
 *
 * The alternative, a `StudentProfile` type assertion, would let a corrupt value
 * through and produce a confidently wrong score. Returning `null` for anything
 * unrecognised is the honest answer.
 */

import type {
  FundingPreference,
  LanguageProficiency,
  StudentAcademic,
  StudentDegree,
  StudentEligibility,
  StudentExperience,
  StudentGoals,
  StudentLanguage,
  StudentPreferences,
  StudentProfile,
  StudyModePreference,
  WorkAuthorization,
} from "@/types/student";

/** Narrows an unknown value to one of a fixed set of strings. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/** Keeps a value only when it is a finite number inside a sensible range. */
function numberInRange(value: unknown, min: number, max: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function stringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  // An empty array is meaningful: it records "none of these", not unknown.
  return value.filter((entry): entry is string => typeof entry === "string");
}

const DEGREES: readonly StudentDegree[] = ["bachelors", "masters", "doctorate"];
const AUTHORISATIONS: readonly WorkAuthorization[] = [
  "citizen",
  "permanent_resident",
  "work_permit",
  "student_visa",
  "no_right_to_work",
  "not_specified",
];
const PROFICIENCIES: readonly LanguageProficiency[] = [
  "basic",
  "conversational",
  "advanced",
  "fluent",
];
const FUNDING: readonly FundingPreference[] = ["any", "fully_funded", "partial"];
const STUDY_MODES: readonly StudyModePreference[] = ["any", "on_campus", "online", "hybrid"];

/**
 * Reads a section, dropping it entirely when it is not an object.
 *
 * A section that fails its own validation is not patched together from the few
 * fields that happened to be valid. It is discarded, so a half-corrupt section
 * cannot masquerade as a mostly-known one.
 */
function section(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function readAcademic(value: unknown): StudentAcademic | undefined {
  const raw = section(value);
  if (raw === undefined) return undefined;

  const academic: StudentAcademic = {};
  const degree = oneOf(raw.currentDegree, DEGREES);
  if (degree !== undefined) academic.currentDegree = degree;

  // GPA is bounded by the 4.0 scale it is defined on. IELTS and TOEFL use their
  // own published scales, which is why they are bounded separately below.
  const gpa = numberInRange(raw.gpa, 0, 4);
  if (gpa !== undefined) academic.gpa = gpa;

  const field = nonEmptyString(raw.fieldOfStudy);
  if (field !== undefined) academic.fieldOfStudy = field;

  const university = nonEmptyString(raw.university);
  if (university !== undefined) academic.university = university;

  const year = numberInRange(raw.graduationYear, 1950, 2040);
  if (year !== undefined) academic.graduationYear = Math.round(year);

  return Object.keys(academic).length === 0 ? undefined : academic;
}

function readLanguages(value: unknown): readonly StudentLanguage[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const languages: StudentLanguage[] = [];
  for (const entry of value) {
    const raw = section(entry);
    if (raw === undefined) continue;
    const language = nonEmptyString(raw.language);
    const proficiency = oneOf(raw.proficiency, PROFICIENCIES);
    if (language !== undefined && proficiency !== undefined) {
      languages.push({ language, proficiency });
    }
  }

  // Preserved even when empty, because "speaks no listed languages" is a fact.
  return languages;
}

function readEligibility(value: unknown): StudentEligibility | undefined {
  const raw = section(value);
  if (raw === undefined) return undefined;

  const eligibility: StudentEligibility = {};

  // Normalised to upper case so "ng" and "NG" behave identically. Shape is
  // deliberately not validated as a real ISO code: the engine only ever compares
  // these strings for equality, so a well-formed two-letter code is enough.
  const citizenship = nonEmptyString(raw.citizenship)?.toUpperCase();
  if (citizenship !== undefined) eligibility.citizenship = citizenship;

  const authorization = oneOf(raw.workAuthorization, AUTHORISATIONS);
  if (authorization !== undefined) eligibility.workAuthorization = authorization;

  const languages = readLanguages(raw.languages);
  if (languages !== undefined) eligibility.languages = languages;

  const tests = section(raw.languageTests);
  if (tests !== undefined) {
    const languageTests: NonNullable<StudentEligibility["languageTests"]> = {};
    const ielts = numberInRange(tests.ielts, 0, 9);
    if (ielts !== undefined) languageTests.ielts = ielts;
    const toefl = numberInRange(tests.toefl, 0, 120);
    if (toefl !== undefined) languageTests.toefl = toefl;
    const duolingo = numberInRange(tests.duolingo, 0, 160);
    if (duolingo !== undefined) languageTests.duolingo = duolingo;
    eligibility.languageTests = languageTests;
  }

  return Object.keys(eligibility).length === 0 ? undefined : eligibility;
}

function readExperience(value: unknown): StudentExperience | undefined {
  const raw = section(value);
  if (raw === undefined) return undefined;

  const experience: StudentExperience = {};
  // `0` is preserved deliberately: "no work experience" is a real answer, and
  // dropping it here would turn a known fact back into an unknown one.
  const work = numberInRange(raw.workExperienceYears, 0, 50);
  if (work !== undefined) experience.workExperienceYears = work;

  const research = numberInRange(raw.researchExperienceYears, 0, 50);
  if (research !== undefined) experience.researchExperienceYears = research;

  if (typeof raw.leadershipExperience === "boolean") {
    experience.leadershipExperience = raw.leadershipExperience;
  }

  return Object.keys(experience).length === 0 ? undefined : experience;
}

function readPreferences(value: unknown): StudentPreferences | undefined {
  const raw = section(value);
  if (raw === undefined) return undefined;

  const preferences: StudentPreferences = {};
  const degree = oneOf(raw.preferredDegree, DEGREES);
  if (degree !== undefined) preferences.preferredDegree = degree;

  const countries = stringArray(raw.preferredCountries)?.map((code) => code.toUpperCase());
  if (countries !== undefined) preferences.preferredCountries = countries;

  const funding = oneOf(raw.fundingPreference, FUNDING);
  if (funding !== undefined) preferences.fundingPreference = funding;

  const mode = oneOf(raw.studyMode, STUDY_MODES);
  if (mode !== undefined) preferences.studyMode = mode;

  return Object.keys(preferences).length === 0 ? undefined : preferences;
}

function readGoals(value: unknown): StudentGoals | undefined {
  const raw = section(value);
  if (raw === undefined) return undefined;

  const goals: StudentGoals = {};
  const fields = stringArray(raw.fieldsOfInterest);
  if (fields !== undefined) goals.fieldsOfInterest = fields;

  const career = nonEmptyString(raw.careerGoal);
  if (career !== undefined) goals.careerGoal = career;

  const startBy = nonEmptyString(raw.startBy);
  // Shape-checked rather than parsed as a real date, because the value is only
  // ever compared as an ISO string, and rejecting it here would silently discard
  // a student's answer.
  if (startBy !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(startBy)) goals.startBy = startBy;

  return Object.keys(goals).length === 0 ? undefined : goals;
}

/**
 * Turns untrusted parsed JSON into a profile, or `null` if it is not one.
 *
 * Unknown top-level keys are dropped rather than rejected, so a profile written
 * by a later version still loads with whatever this version understands. A
 * `schemaVersion` this build does not know is rejected outright: its field
 * meanings may have changed, and guessing would score the visitor wrongly.
 */
export function parseProfile(value: unknown): StudentProfile | null {
  const raw = section(value);
  if (raw === undefined) return null;
  if (raw.schemaVersion !== 1) return null;

  const profile: StudentProfile = { schemaVersion: 1 };

  const displayName = nonEmptyString(raw.displayName);
  if (displayName !== undefined) profile.displayName = displayName;

  const academic = readAcademic(raw.academic);
  if (academic !== undefined) profile.academic = academic;

  const eligibility = readEligibility(raw.eligibility);
  if (eligibility !== undefined) profile.eligibility = eligibility;

  const experience = readExperience(raw.experience);
  if (experience !== undefined) profile.experience = experience;

  const preferences = readPreferences(raw.preferences);
  if (preferences !== undefined) profile.preferences = preferences;

  const goals = readGoals(raw.goals);
  if (goals !== undefined) profile.goals = goals;

  return profile;
}

/** Parses a stored string, returning `null` for missing or unparseable data. */
export function parseStoredProfile(raw: string | null): StudentProfile | null {
  if (raw === null) return null;

  try {
    return parseProfile(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}