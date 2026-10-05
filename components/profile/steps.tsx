"use client";

import { useCallback, useMemo } from "react";

import {
  CheckboxGroup,
  DraftField,
  Field,
  RadioGroup,
  SelectInput,
  TextInput,
} from "@/components/profile/fields";
import { useProfile } from "@/components/profile/profile-provider";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { profileCompletion } from "@/lib/profile/completion";
import {
  COUNTRY_OPTIONS,
  DEGREE_OPTIONS,
  FIELD_OPTIONS,
  FUNDING_OPTIONS,
  LANGUAGE_OPTIONS,
  SECTION_CARD,
  SECTION_HEADING,
  STUDY_MODE_OPTIONS,
  TARGET_DEGREE_OPTIONS,
  WORK_AUTHORIZATION_OPTIONS,
  applySection,
  isCountryCode,
  isIsoDate,
  isNumberInRange,
  numberValue,
  optionValue,
  parseNumber,
} from "@/lib/profile/options";
import type {
  StudentAcademic,
  StudentEligibility,
  StudentExperience,
  StudentGoals,
  StudentLanguage,
  StudentPreferences,
} from "@/types/student";

/**
 * Step 1: the academic record.
 *
 * Kept as its own component rather than one large form so each step is a
 * separately understandable unit, and so the review step can render a summary of
 * the same sections without duplicating the field definitions.
 *
 * Writes go through `update` on every keystroke, which is what lets the match
 * panel beside the form update live. That is only acceptable because the store
 * is local and the engine is pure; a networked form would debounce.
 */
export function AcademicStep() {
  const { profile, update } = useProfile();
  const academic = profile.academic;

  const setAcademic = useCallback(
    (patch: Partial<StudentAcademic>) => {
      update({ academic: applySection(academic, patch) });
    },
    [academic, update],
  );

  return (
    <div className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Academic background</h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        Your academic record carries the most weight in your score. Leave anything
        blank if you would rather not say yet.
      </p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <Field label="Degree you are completing" htmlFor="academic-current-degree">
          <SelectInput
            id="academic-current-degree"
            value={optionValue(academic?.currentDegree)}
            onChange={(value) =>
              setAcademic({ currentDegree: value === "" ? undefined : (value as StudentAcademic["currentDegree"]) })
            }
            options={DEGREE_OPTIONS}
            placeholder="Select your current degree"
          />
        </Field>

        <DraftField
          id="academic-gpa"
          label="GPA"
          hint="On a 4.0 scale. Most providers ask for 3.0 or higher."
          committed={numberValue(academic?.gpa)}
          onCommit={(value) => setAcademic({ gpa: parseNumber(value) })}
          isValid={(value) => isNumberInRange(value, 0, 4)}
          errorMessage="Enter a GPA between 0 and 4."
          inputMode="decimal"
          placeholder="3.70"
        />

        <Field label="Field of study" htmlFor="academic-field">
          <SelectInput
            id="academic-field"
            value={academic?.fieldOfStudy ?? ""}
            onChange={(value) => setAcademic({ fieldOfStudy: value === "" ? undefined : value })}
            options={FIELD_OPTIONS}
            placeholder="Select your field"
          />
        </Field>

        <DraftField
          id="academic-graduation-year"
          label="Graduation year"
          hint="Your expected or actual completion year."
          committed={numberValue(academic?.graduationYear)}
          onCommit={(value) => setAcademic({ graduationYear: parseNumber(value) })}
          isValid={(value) => isNumberInRange(value, 1950, 2040)}
          errorMessage="Enter a year between 1950 and 2040."
          inputMode="numeric"
          placeholder="2026"
        />
      </div>

      <Field
        label="Current institution"
        htmlFor="academic-university"
        className="mt-6"
        hint="Optional. Some providers ask for your current institution."
      >
        {(field) => (
          <TextInput
            id="academic-university"
            autoComplete="organization"
            value={academic?.university ?? ""}
            onChange={(value) => setAcademic({ university: value === "" ? undefined : value })}
            placeholder="Northbridge University"
            {...field}
          />
        )}
      </Field>

      <AcademicNote academic={academic} />
    </div>
  );
}

/**
 * Explains what the engine will do with the two answers that gate applications.
 *
 * Without this the GPA field looks like a formality, and a student has no reason
 * to believe it can disqualify them from everything.
 */
function AcademicNote({ academic }: { academic: StudentAcademic | undefined }) {
  const missing = [
    academic?.gpa === undefined ? "GPA" : null,
    academic?.currentDegree === undefined ? "current degree" : null,
    academic?.fieldOfStudy === undefined ? "field of study" : null,
  ].filter((item): item is string => item !== null);

  if (missing.length === 0) return null;

  return (
    <p className="mt-6 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-relaxed text-mist-300">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
      <span>
        Still to add: {missing.join(", ")}. We score only what we know, so a
        partial answer gives a provisional score rather than a misleading one.
      </span>
    </p>
  );
}

/** Step 2: citizenship, authorisation and language evidence. */
export function EligibilityStep() {
  const { profile, update } = useProfile();
  const eligibility = profile.eligibility;

  const setEligibility = useCallback(
    (patch: Partial<StudentEligibility>) => {
      update({ eligibility: applySection(eligibility, patch) });
    },
    [eligibility, update],
  );

  const tests = eligibility?.languageTests;

  const setTest = useCallback(
    (key: "ielts" | "toefl" | "duolingo", value: string) => {
      setEligibility({ languageTests: applySection(tests, { [key]: parseNumber(value) }) });
    },
    [setEligibility, tests],
  );

  return (
    <div className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Eligibility</h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        The requirements providers list as hard conditions. An unmet hard
        requirement caps your score no matter how strong the rest of your
        application is.
      </p>

      <div className="mt-7 grid gap-6">
        <DraftField
          id="eligibility-citizenship"
          label="Citizenship"
          hint="Two-letter country code, such as NG or DE. Every opportunity in our current collection is open to all nationalities, so this records your profile rather than changing your score."
          committed={eligibility?.citizenship ?? ""}
          onCommit={(value) =>
            // Cleared means unknown, not an empty country code: an empty string
            // would read as an answered field that matches no record.
            setEligibility({
              citizenship: value.trim() === "" ? undefined : value.trim().toUpperCase(),
            })
          }
          isValid={(value) => value === "" || isCountryCode(value)}
          errorMessage="Enter a two-letter country code, such as NG."
          autoComplete="country"
          placeholder="NG"
        />

        <RadioGroup
          legend="Work authorisation"
          name="eligibility-authorization"
          hint="Where you have the right to live and study."
          value={eligibility?.workAuthorization}
          onChange={(value) => setEligibility({ workAuthorization: value })}
          options={WORK_AUTHORIZATION_OPTIONS}
        />

        <div className="grid gap-6 border-t border-hairline-soft pt-6 sm:grid-cols-3">
          <DraftField
            id="eligibility-ielts"
            label="IELTS"
            hint="Band, 0-9."
            committed={numberValue(tests?.ielts)}
            onCommit={(value) => setTest("ielts", value)}
            isValid={(value) => isNumberInRange(value, 0, 9)}
            errorMessage="Enter a band between 0 and 9."
            inputMode="decimal"
            placeholder="7.5"
          />

          <DraftField
            id="eligibility-toefl"
            label="TOEFL"
            hint="Score, 0-120."
            committed={numberValue(tests?.toefl)}
            onCommit={(value) => setTest("toefl", value)}
            isValid={(value) => isNumberInRange(value, 0, 120)}
            errorMessage="Enter a score between 0 and 120."
            inputMode="numeric"
            placeholder="108"
          />

          <DraftField
            id="eligibility-duolingo"
            label="Duolingo"
            hint="Score, 0-160."
            committed={numberValue(tests?.duolingo)}
            onCommit={(value) => setTest("duolingo", value)}
            isValid={(value) => isNumberInRange(value, 0, 160)}
            errorMessage="Enter a score between 0 and 160."
            inputMode="numeric"
            placeholder="120"
          />
        </div>

        <CheckboxGroup
          legend="Languages you speak"
          name="eligibility-languages"
          hint="Used for destination fit. No demo opportunity requires a specific spoken language."
          values={(eligibility?.languages ?? []).map(
            (entry) => `${entry.language}:${entry.proficiency}`,
          )}
          onToggle={(encoded) => {
            // The checkbox works in `language:proficiency` strings so the value
            // can be a plain key; the pair is decoded back into the typed shape.
            const [language, proficiency] = encoded.split(":");
            if (language === undefined || proficiency === undefined) return;

            const entry = {
              language,
              proficiency: proficiency as StudentLanguage["proficiency"],
            };

            const current = eligibility?.languages ?? [];
            const exists = current.some(
              (item) => item.language === entry.language && item.proficiency === entry.proficiency,
            );

            setEligibility({
              languages: exists
                ? current.filter(
                    (item) =>
                      !(item.language === entry.language && item.proficiency === entry.proficiency),
                  )
                : [...current, entry],
            });
          }}
          options={LANGUAGE_OPTIONS.map((entry) => ({
            value: `${entry.language}:${entry.proficiency}`,
            label: `${entry.language} (${entry.proficiency})`,
          }))}
        />

        <LanguageNote hasAnyTest={tests !== undefined && Object.keys(tests).length > 0} />
      </div>
    </div>
  );
}

/** Explains that an unanswered language requirement is a review item, not a rejection. */
function LanguageNote({ hasAnyTest }: { hasAnyTest: boolean }) {
  return (
    <p className="flex gap-3 rounded-xl border border-hairline-soft bg-white/[0.03] p-4 text-sm leading-relaxed text-mist-400">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-azure-300" aria-hidden="true" />
      <span>
        {hasAnyTest
          ? "We compare your scores against the minimum each provider publishes. Where a provider offers a waiver, we flag it for you to confirm rather than failing you."
          : "No language scores yet. Several awards accept a waiver, so we will flag those for you to confirm rather than treating the gap as a rejection."}
      </span>
    </p>
  );
}

/** Step 3: work, research and leadership history. */
export function ExperienceStep() {
  const { profile, update } = useProfile();
  const experience = profile.experience;

  const setExperience = useCallback(
    (patch: Partial<StudentExperience>) => {
      update({ experience: applySection(experience, patch) });
    },
    [experience, update],
  );

  const work = experience?.workExperienceYears;
  const research = experience?.researchExperienceYears;

  return (
    <div className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Experience</h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        Scholarships weight practical evidence differently. Some want a
        portfolio, some want research output, and some ask for proof of financial
        need.
      </p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <DraftField
          id="experience-work"
          label="Years of work experience"
          hint="Enter 0 if you have none. That is a different answer from leaving this blank."
          committed={numberValue(work)}
          onCommit={(value) => setExperience({ workExperienceYears: parseNumber(value) })}
          isValid={(value) => isNumberInRange(value, 0, 50)}
          errorMessage="Enter a number between 0 and 50."
          inputMode="numeric"
          placeholder="2"
        />

        <DraftField
          id="experience-research"
          label="Years of research experience"
          hint="Publications, lab work or a dissertation."
          committed={numberValue(research)}
          onCommit={(value) => setExperience({ researchExperienceYears: parseNumber(value) })}
          isValid={(value) => isNumberInRange(value, 0, 50)}
          errorMessage="Enter a number between 0 and 50."
          inputMode="numeric"
          placeholder="1"
        />
      </div>

      <div className="mt-6">
        <RadioGroup
          legend="Leadership experience"
          name="experience-leadership"
          columns={1}
          value={
            experience?.leadershipExperience === undefined
              ? undefined
              : experience.leadershipExperience
                ? "yes"
                : "no"
          }
          onChange={(value) => setExperience({ leadershipExperience: value === "yes" })}
          options={[
            { value: "yes", label: "Yes", hint: "Club, society, team or campaign leadership" },
            { value: "no", label: "No", hint: "Not at present" },
          ]}
        />
      </div>
    </div>
  );
}

/** Step 4: what the student is looking for. */
export function PreferencesStep() {
  const { profile, update } = useProfile();
  const preferences = profile.preferences;

  const setPreferences = useCallback(
    (patch: Partial<StudentPreferences>) => {
      update({ preferences: applySection(preferences, patch) });
    },
    [preferences, update],
  );

  const countries = preferences?.preferredCountries ?? [];

  return (
    <div className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Preferences</h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        Preferences change the order of your results but never make an
        opportunity ineligible.
      </p>

      <div className="mt-7 grid gap-6">
        <Field label="Degree you want to study" htmlFor="preferences-degree">
          <SelectInput
            id="preferences-degree"
            value={optionValue(preferences?.preferredDegree)}
            onChange={(value) =>
              setPreferences({
                preferredDegree:
                  value === "" ? undefined : (value as StudentPreferences["preferredDegree"]),
              })
            }
            options={TARGET_DEGREE_OPTIONS}
            placeholder="Select your target degree"
          />
        </Field>

        <RadioGroup
          legend="Funding"
          name="preferences-funding"
          hint="Applied as a soft preference: a mismatch lowers the score but never disqualifies you."
          value={preferences?.fundingPreference}
          onChange={(value) => setPreferences({ fundingPreference: value })}
          options={FUNDING_OPTIONS}
        />

        <RadioGroup
          legend="Study mode"
          name="preferences-mode"
          value={preferences?.studyMode}
          onChange={(value) => setPreferences({ studyMode: value })}
          options={STUDY_MODE_OPTIONS}
        />

        <CheckboxGroup
          legend="Preferred destinations"
          name="preferences-countries"
          hint="Leave all unticked if location does not matter to you."
          values={countries}
          onToggle={(code) => {
            const next = countries.includes(code)
              ? countries.filter((item) => item !== code)
              : [...countries, code];
            setPreferences({ preferredCountries: next.length === 0 ? undefined : next });
          }}
          options={COUNTRY_OPTIONS}
        />
      </div>
    </div>
  );
}

/** Step 5: goals. Explicitly optional. */
export function GoalsStep() {
  const { profile, update } = useProfile();
  const goals = profile.goals;

  const setGoals = useCallback(
    (patch: Partial<StudentGoals>) => {
      update({ goals: applySection(goals, patch) });
    },
    [goals, update],
  );

  return (
    <div className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Goals</h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        Entirely optional. Goals shape how we describe a fit to you, never whether
        you are eligible.
      </p>

      <div className="mt-7 grid gap-6">
        <CheckboxGroup
          legend="Fields you are interested in"
          name="goals-fields"
          hint="Useful when you are open to several directions."
          values={goals?.fieldsOfInterest ?? []}
          onToggle={(field) => {
            const current = goals?.fieldsOfInterest ?? [];
            const next = current.includes(field)
              ? current.filter((item) => item !== field)
              : [...current, field];
            setGoals({ fieldsOfInterest: next.length === 0 ? undefined : next });
          }}
          options={FIELD_OPTIONS}
        />

        <Field
          label="What you want to do afterwards"
          htmlFor="goals-career"
          hint="For example: work in climate policy, publish a thesis, return to practice."
        >
          {(field) => (
            <TextInput
              id="goals-career"
              value={goals?.careerGoal ?? ""}
              onChange={(value) => setGoals({ careerGoal: value === "" ? undefined : value })}
              placeholder="Machine learning research"
              {...field}
            />
          )}
        </Field>

        <DraftField
          id="goals-start"
          label="Earliest start date"
          hint="As YYYY-MM-DD, for example 2027-09-01. Helps us surface opportunities with deadlines that still work."
          committed={goals?.startBy ?? ""}
          onCommit={(value) =>
            setGoals({ startBy: value.trim() === "" ? undefined : value.trim() })
          }
          isValid={(value) => value.trim() === "" || isIsoDate(value)}
          errorMessage="Enter a real date as YYYY-MM-DD, for example 2027-09-01."
          inputMode="numeric"
          placeholder="2027-09-01"
        />
      </div>
    </div>
  );
}

/** Step 6: saved-state summary and the deliberate way to discard a profile. */
export function ResetStep() {
  const { profile, isHydrated, clear } = useProfile();
  const completion = useMemo(() => profileCompletion(profile), [profile]);

  // Counted from the completion calculation rather than by counting keys on one
  // section. The old version reported only academic answers, so a student who had
  // filled in work authorisation and destinations was told they had nothing saved.
  //
  // Withheld before hydration: the server sees no stored profile at all, so any
  // count it rendered would be a confident zero to somebody who has filled the
  // whole thing in.
  const summary = !isHydrated ? null : completion.answeredCount === 0
    ? "Nothing saved yet."
    : `${completion.answeredCount} of ${completion.fieldCount} scored answers saved (${completion.essentialAnswered} of ${completion.essentialTotal} essential).`;

  return (
    <div className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Saved profile</h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        Every answer is saved to this browser as you type. There is no account, and
        nothing is sent to a server, so clearing your browser data will remove it.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ConfirmAction
          label="Clear profile"
          confirmLabel="Yes, clear it"
          question="This permanently removes every answer stored in this browser. It cannot be undone."
          onConfirm={clear}
          variant="secondary"
        />
        {summary !== null ? (
          <span className="text-sm text-mist-500">{summary}</span>
        ) : null}
      </div>
    </div>
  );
}