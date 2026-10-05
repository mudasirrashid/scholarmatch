/**
 * Student profile model.
 *
 * Phase 03 introduces a real profile so the matching engine has something
 * structured to evaluate. Nothing here is persisted to a server: the profile is
 * assembled in the browser and, when a backend arrives, the same shape becomes
 * the payload and the response contract.
 *
 * ## Unknown versus none
 *
 * The single most important rule in this file: **an omitted property means
 * "unknown", and an explicit empty value means "known to be none".** These are
 * genuinely different facts to a matching engine and the profile builder needs
 * to keep them apart.
 *
 * - `gpa` omitted            -> we do not know the GPA, so we cannot rule the
 *                               student out on an academic floor.
 * - `workExperienceYears: 0`  -> we know the student has no work experience.
 * - `languageTests` omitted   -> no test has been taken, which is different
 *                               from taking one and failing it.
 *
 * The engine never treats unknown as a failure; it surfaces it as missing
 * information instead.
 */

/** Degree levels a student can be currently enrolled in or targeting. */
export type StudentDegree = "bachelors" | "masters" | "doctorate";

/**
 * How a student is authorised to study or work where the award is hosted.
 *
 * `not_specified` is a profile value rather than an absence so the profile
 * builder can offer it explicitly; leaving the field unset entirely is how a
 * student says "I have not entered this yet".
 */
export type WorkAuthorization =
  | "citizen"
  | "permanent_resident"
  | "work_permit"
  | "student_visa"
  | "no_right_to_work"
  | "not_specified";

/** Spoken-language proficiency, used for waiver reasoning and destination fit. */
export type LanguageProficiency = "basic" | "conversational" | "advanced" | "fluent";

export interface StudentLanguage {
  /** BCP 47 tag when known, otherwise a plain language name. */
  language: string;
  proficiency: LanguageProficiency;
}

/**
 * Scores for the proficiency tests providers accept.
 *
 * Keys are omitted when the student has not taken that test, so "no result" and
 * "a low result" never collapse into the same value.
 */
export interface StudentLanguageTests {
  ielts?: number;
  toefl?: number;
  duolingo?: number;
}

/** Academic record. */
export interface StudentAcademic {
  /** Degree the student holds or is currently completing. */
  currentDegree?: StudentDegree;
  /** GPA on a 4.0 scale. */
  gpa?: number;
  /** Primary field of study, matching the explorer vocabulary. */
  fieldOfStudy?: string;
  /** Current or most recent institution. */
  university?: string;
  /** Expected or actual graduation year. */
  graduationYear?: number;
}

/** Everything that governs whether a student may apply at all. */
export interface StudentEligibility {
  /** ISO 3166-1 alpha-2 country code of citizenship. */
  citizenship?: string;
  workAuthorization?: WorkAuthorization;
  languages?: readonly StudentLanguage[];
  /** Test scores; omit a key to record that the test was not taken. */
  languageTests?: StudentLanguageTests;
}

/** Work, research and leadership history. */
export interface StudentExperience {
  /** `0` is a real answer; omit the field when unknown. */
  workExperienceYears?: number;
  /** Years of research activity, relevant to research-track awards. */
  researchExperienceYears?: number;
  leadershipExperience?: boolean;
}

/** Delivery format the student wants. */
export type StudyModePreference = "any" | "on_campus" | "online" | "hybrid";

/** How much of the cost the student expects the award to cover. */
export type FundingPreference = "any" | "fully_funded" | "partial";

export interface StudentPreferences {
  /** Degree level the student wants to study towards. */
  preferredDegree?: StudentDegree;
  /** ISO 3166-1 alpha-2 codes the student would consider. */
  preferredCountries?: readonly string[];
  fundingPreference?: FundingPreference;
  studyMode?: StudyModePreference;
}

/** Longer-horizon intent, used for fit nudges rather than eligibility. */
export interface StudentGoals {
  fieldsOfInterest?: readonly string[];
  careerGoal?: string;
  /** Earliest the student could start, as an ISO `YYYY-MM-DD` date. */
  startBy?: string;
}

/**
 * The complete profile handed to the matching engine.
 *
 * Every section is optional so the builder can persist partial progress and the
 * engine can score whatever exists. `schemaVersion` lets a later phase migrate
 * stored profiles without guessing.
 */
export interface StudentProfile {
  schemaVersion: 1;
  /** Short label shown in the UI. Never used as a matching input. */
  displayName?: string;
  academic?: StudentAcademic;
  eligibility?: StudentEligibility;
  experience?: StudentExperience;
  preferences?: StudentPreferences;
  goals?: StudentGoals;
}

/** Sections of the profile builder, in order. */
export type ProfileSectionId =
  | "academic"
  | "eligibility"
  | "experience"
  | "preferences"
  | "goals"
  | "review";

export interface ProfileSection {
  id: ProfileSectionId;
  /** Two-digit display index, matching the rest of the product. */
  index: string;
  label: string;
  description: string;
}

/** An empty profile at the current schema version. */
export function emptyProfile(): StudentProfile {
  return { schemaVersion: 1 };
}