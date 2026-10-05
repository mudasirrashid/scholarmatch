"use client";

import type { Dispatch, SetStateAction } from "react";

import { knownFields } from "@/lib/matching";

import type {
  FundingPreference,
  StudyModePreference,
  StudentDegree,
  WorkAuthorization,
} from "@/types/student";
import type {
  StudentAcademic,
  StudentEligibility,
  StudentExperience,
  StudentGoals,
  StudentPreferences,
} from "@/types/student";

/**
 * Options offered by the profile builder.
 *
 * Every list a visitor can pick from lives here rather than inside a component,
 * so the wording, ordering and values are reviewable in one place and a later
 * backend can serve the same vocabulary.
 *
 * All options are annotated with the reason they exist, because a bare list of
 * countries or fields is not self-explanatory and inviting someone to guess is
 * how profiles end up wrong.
 */

/** Degree levels a profile can record. */
export const DEGREE_OPTIONS: readonly { value: StudentDegree; label: string }[] = [
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "doctorate", label: "Doctorate (PhD)" },
];

/** Degrees a student might be applying to, including a step below. */
export const TARGET_DEGREE_OPTIONS: readonly { value: StudentDegree; label: string }[] = [
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "doctorate", label: "Doctorate (PhD)" },
];

/**
 * Fields offered in the builder.
 *
 * `knownFields` returns the cluster names from the engine's taxonomy, which is
 * what the field comparison actually uses. Offering the same list here means a
 * student can never select a field the engine then has to classify as unknown.
 */
export const FIELD_OPTIONS: readonly { value: string; label: string }[] = knownFields().map(
  (field) => ({ value: field, label: field }),
);

/** Work authorisation values, with the consequence spelled out. */
export const WORK_AUTHORIZATION_OPTIONS: readonly {
  value: WorkAuthorization;
  label: string;
  hint: string;
}[] = [
  { value: "citizen", label: "Citizen", hint: "You hold citizenship in the destination" },
  {
    value: "permanent_resident",
    label: "Permanent resident",
    hint: "You have settled status in the destination",
  },
  {
    value: "work_permit",
    label: "Work permit",
    hint: "You may work in the destination without a separate student visa",
  },
  {
    value: "student_visa",
    label: "Student visa",
    hint: "You would apply for a student visa to study there",
  },
  {
    value: "no_right_to_work",
    label: "None yet",
    hint: "You would need a visa for every destination",
  },
];

/** How much of the cost the student needs covered. */
export const FUNDING_OPTIONS: readonly {
  value: FundingPreference;
  label: string;
  hint: string;
}[] = [
  {
    value: "fully_funded",
    label: "Fully funded only",
    hint: "Tuition, living costs and insurance covered",
  },
  {
    value: "partial",
    label: "Some funding helps",
    hint: "Stipends or tuition offsets count",
  },
  { value: "any", label: "No preference", hint: "Show everything" },
];

/** Study format. */
export const STUDY_MODE_OPTIONS: readonly {
  value: StudyModePreference;
  label: string;
  hint: string;
}[] = [
  { value: "on_campus", label: "On campus", hint: "In person" },
  { value: "online", label: "Online", hint: "Fully remote" },
  { value: "hybrid", label: "Either", hint: "No strong preference" },
  { value: "any", label: "No preference", hint: "Show everything" },
];

/**
 * Destinations offered.
 *
 * Limited to countries present in the demo collection. A profile builder that
 * offered every country on earth would be collecting information nothing can
 * yet use, and would imply a coverage the product does not have.
 */
export const COUNTRY_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "DE", label: "Germany" },
  { value: "NL", label: "Netherlands" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "United States" },
  { value: "TR", label: "Turkiye" },
  { value: "JP", label: "Japan" },
  { value: "SE", label: "Sweden" },
  { value: "FR", label: "France" },
  { value: "AU", label: "Australia" },
];

/** A language and how well the student speaks it. */
export interface LanguageOption {
  language: string;
  proficiency: "conversational" | "advanced" | "fluent";
}

/** Common languages and levels, offered as a multi-select. */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { language: "English", proficiency: "fluent" },
  { language: "English", proficiency: "advanced" },
  { language: "English", proficiency: "conversational" },
  { language: "French", proficiency: "advanced" },
  { language: "French", proficiency: "conversational" },
  { language: "Spanish", proficiency: "advanced" },
  { language: "German", proficiency: "advanced" },
  { language: "German", proficiency: "conversational" },
  { language: "Arabic", proficiency: "advanced" },
  { language: "Hindi", proficiency: "advanced" },
  { language: "Mandarin", proficiency: "advanced" },
];

/* ==========================================================================
   Helpers
   --------------------------------------------------------------------------
   Each helper converts between the profile's optional typed value and the plain
   string a controlled input holds. Empty string always means "not answered",
   which is what keeps the engine's unknown-versus-none distinction intact.
   ========================================================================== */

/** Parses a numeric input, returning `undefined` when blank or invalid. */
export function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Whether a typed number is one the profile is allowed to store.
 *
 * `parseNumber` answers "is this a number", which is not the same question: `9.5`
 * is a perfectly good number that a 4.0 GPA cannot be. The builder checks a value
 * against its field's real scale before writing it, so an out-of-range keystroke
 * never reaches storage.
 *
 * An empty string is treated as acceptable, because clearing a field is a valid
 * answer here: it records "not answered yet" rather than a wrong value.
 */
export function isNumberInRange(value: string, min: number, max: number): boolean {
  if (value.trim() === "") return true;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

/**
 * Whether a string is a two-letter country code.
 *
 * Citizenship is only ever compared for equality against ISO 3166-1 alpha-2 codes
 * in the scholarship records, so a full country name or a three-letter code can
 * never match anything while still reading as a filled-in field. Rejecting it at
 * entry keeps an unusable value from counting as an answer.
 */
export function isCountryCode(value: string): boolean {
  return /^[A-Za-z]{2}$/.test(value.trim());
}

/** Whether a string is an ISO `YYYY-MM-DD` date the profile will accept. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;

  // Shape alone would accept `2027-13-45`. Confirm the date actually exists, and
  // that it round-trips, so the value means what it says.
  const parsed = new Date(`${value.trim()}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value.trim();
}

/** Renders an optional number for a controlled input. */
export function numberValue(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

/** Renders an optional enum for a controlled input. */
export function optionValue<T extends string>(value: T | undefined): string {
  return value ?? "";
}

/**
 * Applies a patch to one section, dropping empty keys.
 *
 * Writing `undefined` explicitly would be enough for the engine, which treats a
 * missing key and an undefined value identically. Dropping them keeps the
 * persisted JSON small and readable.
 */
export function applySection<T extends object>(
  section: T | undefined,
  patch: Partial<T>,
): T | undefined {
  const next = { ...(section ?? ({} as T)), ...patch };

  for (const key of Object.keys(next) as (keyof T)[]) {
    if (next[key] === undefined) delete next[key];
  }

  return Object.keys(next).length === 0 ? undefined : next;
}

/** Typed setters for each section, all pure. */
export type ProfileSetters = {
  academic: Dispatch<SetStateAction<StudentAcademic | undefined>>;
  eligibility: Dispatch<SetStateAction<StudentEligibility | undefined>>;
  experience: Dispatch<SetStateAction<StudentExperience | undefined>>;
  preferences: Dispatch<SetStateAction<StudentPreferences | undefined>>;
  goals: Dispatch<SetStateAction<StudentGoals | undefined>>;
};

/** Utility class shared by the section cards. */
export const SECTION_CARD = "surface-glass edge-highlight rounded-2xl p-6 sm:p-7";

/** Section heading, sized to read as a document outline. */
export const SECTION_HEADING =
  "font-display text-2xl font-normal tracking-[-0.02em] text-mist-50 sm:text-3xl";