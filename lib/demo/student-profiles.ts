/**
 * Demo student profiles.
 *
 * Phase 03 needs profiles that exercise every branch of the matching engine.
 * These six do that deliberately, and `scripts/verify-matching.ts` asserts the
 * behaviour each one is here to demonstrate.
 *
 * They are illustrative data. No record corresponds to a real applicant, and
 * nothing here is presented as a user statistic.
 */

import { parseProfile } from "@/lib/profile/parse";

import type { StudentProfile } from "@/types/student";

/** A strong applicant who clears every bar the demo data can express. */
export const profileA = {
  schemaVersion: 1,
  displayName: "Profile A - Strong applicant",
  academic: {
    currentDegree: "bachelors",
    gpa: 3.8,
    fieldOfStudy: "Computer Science",
    university: "Northbridge University",
    graduationYear: 2026,
  },
  eligibility: {
    citizenship: "NG",
    workAuthorization: "student_visa",
    languages: [
      { language: "English", proficiency: "fluent" },
      { language: "French", proficiency: "conversational" },
    ],
    languageTests: { ielts: 7.5, toefl: 108 },
  },
  experience: {
    workExperienceYears: 2,
    researchExperienceYears: 1,
    leadershipExperience: true,
  },
  preferences: {
    preferredDegree: "masters",
    preferredCountries: ["DE", "NL", "GB"],
    fundingPreference: "fully_funded",
    studyMode: "on_campus",
  },
  goals: {
    fieldsOfInterest: ["Computer Science", "Data Science"],
    careerGoal: "Machine learning research",
    startBy: "2027-09-01",
  },
} as const satisfies StudentProfile;

/**
 * Deliberately thin: GPA, field and degree are absent.
 *
 * The engine must report these as unknown and ask for them, never as failures
 * and never as passes.
 */
export const profileB = {
  schemaVersion: 1,
  displayName: "Profile B - Incomplete profile",
  academic: {},
  eligibility: {},
} as const satisfies StudentProfile;

/**
 * Clears every soft requirement and fails the GPA floor outright: a 2.60 GPA
 * against awards asking for 3.0 and above.
 */
export const profileC = {
  schemaVersion: 1,
  displayName: "Profile C - Below the academic floor",
  academic: {
    currentDegree: "masters",
    gpa: 2.3,
    fieldOfStudy: "Social Sciences",
    university: "Lakeside College",
    graduationYear: 2025,
  },
  eligibility: {
    citizenship: "NG",
    workAuthorization: "student_visa",
    languageTests: { ielts: 7 },
  },
  experience: { workExperienceYears: 1 },
  preferences: {
    preferredDegree: "masters",
    fundingPreference: "fully_funded",
  },
} as const satisfies StudentProfile;

/** Medicine and health, aimed at awards that cover other fields entirely. */
export const profileD = {
  schemaVersion: 1,
  displayName: "Profile D - Different field",
  academic: {
    currentDegree: "bachelors",
    gpa: 3.6,
    fieldOfStudy: "Medicine",
    university: "Kingsway Medical College",
    graduationYear: 2026,
  },
  eligibility: {
    citizenship: "GB",
    workAuthorization: "citizen",
    languageTests: { ielts: 7.5 },
  },
  experience: {
    workExperienceYears: 1,
    researchExperienceYears: 2,
  },
  preferences: {
    preferredDegree: "doctorate",
    fundingPreference: "fully_funded",
  },
} as const satisfies StudentProfile;

/** Holds a doctorate and targets one: the step-up and below-entry cases. */
export const profileE = {
  schemaVersion: 1,
  displayName: "Profile E - Doctorate level",
  academic: {
    currentDegree: "doctorate",
    gpa: 3.9,
    fieldOfStudy: "Data Science",
    university: "Aurora Institute",
  },
  eligibility: {
    citizenship: "NG",
    workAuthorization: "work_permit",
    languageTests: { toefl: 112 },
  },
  experience: {
    workExperienceYears: 4,
    researchExperienceYears: 5,
    leadershipExperience: true,
  },
  preferences: {
    preferredDegree: "doctorate",
    preferredCountries: ["NL", "AU"],
    fundingPreference: "fully_funded",
  },
} as const satisfies StudentProfile;

/** Needs only part of the cost covered, and wants a specific destination. */
export const profileF = {
  schemaVersion: 1,
  displayName: "Profile F - Funding sensitive",
  academic: {
    currentDegree: "bachelors",
    gpa: 3.4,
    fieldOfStudy: "Business",
    university: "Westgate Faculty of Commerce",
    graduationYear: 2026,
  },
  eligibility: {
    citizenship: "PK",
    workAuthorization: "student_visa",
    languageTests: { ielts: 6.5, toefl: 92 },
  },
  experience: {
    workExperienceYears: 1,
    leadershipExperience: true,
  },
  preferences: {
    preferredDegree: "masters",
    preferredCountries: ["AU"],
    fundingPreference: "partial",
  },
} as const satisfies StudentProfile;

/** Every demo profile, in a stable order. */
export const demoProfiles = [
  profileA,
  profileB,
  profileC,
  profileD,
  profileE,
  profileF,
] as const satisfies readonly StudentProfile[];

/**
 * The profile the site's own surfaces score against.
 *
 * The homepage, explorer and detail pages are server-rendered, so they need a
 * profile that exists in the build rather than one from browser storage. Profile
 * A stands in for that student and is labelled as a demo everywhere it appears.
 */
export const activeDemoProfile: StudentProfile = profileA;

/** Value comparison that ignores key order. */
function structurallyEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;

  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null) {
    return false;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    return (
      left.length === right.length &&
      left.every((entry, position) => structurallyEqual(entry, right[position]))
    );
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, position) => {
      if (key !== rightKeys[position]) return false;
      return structurallyEqual(
        (left as Record<string, unknown>)[key],
        (right as Record<string, unknown>)[key],
      );
    })
  );
}

/**
 * Whether a profile is one of the demos, still untouched.
 *
 * The profile builder needs this in two places: to avoid destroying real answers
 * when a demo is loaded over them, and to label what is on screen, because a
 * visitor should never be unsure whether they are looking at their own profile or
 * at sample data.
 *
 * Both sides are run through `parseProfile` before comparing. A stored profile has
 * been through it already, and the demo literals have not, so comparing them
 * directly would fail on cosmetic differences such as empty sections being
 * dropped, leaving Profile B permanently unrecognisable.
 *
 * Deliberately strict: once a demo has been edited it stops being a demo, and the
 * page says so. That is the safe direction to be wrong in.
 */
export function isDemoProfile(profile: StudentProfile): boolean {
  return demoProfiles.some((demo) => {
    const normalised = parseProfile({ ...demo });
    return normalised !== null && structurallyEqual(profile, normalised);
  });
}