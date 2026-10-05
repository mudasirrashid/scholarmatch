"use client";

import { useCallback, useMemo } from "react";

import {
  CheckboxGroup,
  Field,
  RadioGroup,
  SelectInput,
  TextInput,
} from "@/components/profile/fields";
import { useProfile } from "@/components/profile/profile-provider";
import { Button } from "@/components/ui/button";
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
        These four answers drive the heaviest-weighted part of your match. Leave
        anything blank if you would rather not say yet.
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

        <Field
          label="GPA"
          htmlFor="academic-gpa"
          hint="On a 4.0 scale. Most providers ask for 3.0 or higher."
        >
          {(field) => (
            <TextInput
              id="academic-gpa"
              type="number"
              inputMode="decimal"
              min={0}
              max={4}
              step={0.01}
              value={numberValue(academic?.gpa)}
              onChange={(value) => setAcademic({ gpa: parseNumber(value) })}
              placeholder="3.70"
              {...field}
            />
          )}
        </Field>

        <Field label="Field of study" htmlFor="academic-field">
          <SelectInput
            id="academic-field"
            value={academic?.fieldOfStudy ?? ""}
            onChange={(value) => setAcademic({ fieldOfStudy: value === "" ? undefined : value })}
            options={FIELD_OPTIONS}
            placeholder="Select your field"
          />
        </Field>

        <Field
          label="Graduation year"
          htmlFor="academic-graduation-year"
          hint="Your expected or actual completion year."
        >
          {(field) => (
            <TextInput
              id="academic-graduation-year"
              type="number"
              inputMode="numeric"
              min={1950}
              max={2040}
              step={1}
              value={numberValue(academic?.graduationYear)}
              onChange={(value) => setAcademic({ graduationYear: parseNumber(value) })}
              placeholder="2026"
              {...field}
            />
          )}
        </Field>
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
        <Field
          label="Citizenship"
          htmlFor="eligibility-citizenship"
          hint="ISO country code. All twelve demo opportunities are open to every nationality, so this mainly records your profile."
        >
          {(field) => (
            <TextInput
              id="eligibility-citizenship"
              autoComplete="country"
              value={eligibility?.citizenship ?? ""}
              onChange={(value) =>
                setEligibility({ citizenship: value.trim() === "" ? undefined : value.trim().toUpperCase() })
              }
              placeholder="NG"
              {...field}
            />
          )}
        </Field>

        <RadioGroup
          legend="Work authorisation"
          name="eligibility-authorization"
          hint="Where you have the right to live and study."
          value={eligibility?.workAuthorization}
          onChange={(value) => setEligibility({ workAuthorization: value })}
          options={WORK_AUTHORIZATION_OPTIONS}
        />

        <div className="grid gap-6 border-t border-hairline-soft pt-6 sm:grid-cols-3">
          <Field
            label="IELTS"
            htmlFor="eligibility-ielts"
            hint="Band, 0-9."
          >
            {(field) => (
              <TextInput
                id="eligibility-ielts"
                type="number"
                inputMode="decimal"
                min={0}
                max={9}
                step={0.5}
                value={numberValue(tests?.ielts)}
                onChange={(value) => setTest("ielts", value)}
                placeholder="7.5"
                {...field}
              />
            )}
          </Field>

          <Field label="TOEFL" htmlFor="eligibility-toefl" hint="Score, 0-120.">
            {(field) => (
              <TextInput
                id="eligibility-toefl"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                step={1}
                value={numberValue(tests?.toefl)}
                onChange={(value) => setTest("toefl", value)}
                placeholder="108"
                {...field}
              />
            )}
          </Field>

          <Field
            label="Duolingo"
            htmlFor="eligibility-duolingo"
            hint="Score, 0-160."
          >
            {(field) => (
              <TextInput
                id="eligibility-duolingo"
                type="number"
                inputMode="numeric"
                min={0}
                max={160}
                step={1}
                value={numberValue(tests?.duolingo)}
                onChange={(value) => setTest("duolingo", value)}
                placeholder="120"
                {...field}
              />
            )}
          </Field>
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
        <Field
          label="Years of work experience"
          htmlFor="experience-work"
          hint="Enter 0 if you have none. That is a different answer from leaving this blank."
        >
          {(field) => (
            <TextInput
              id="experience-work"
              type="number"
              inputMode="numeric"
              min={0}
              max={50}
              step={1}
              value={numberValue(work)}
              onChange={(value) => setExperience({ workExperienceYears: parseNumber(value) })}
              placeholder="2"
              {...field}
            />
          )}
        </Field>

        <Field
          label="Years of research experience"
          htmlFor="experience-research"
          hint="Publications, lab work or a dissertation."
        >
          {(field) => (
            <TextInput
              id="experience-research"
              type="number"
              inputMode="numeric"
              min={0}
              max={50}
              step={1}
              value={numberValue(research)}
              onChange={(value) => setExperience({ researchExperienceYears: parseNumber(value) })}
              placeholder="1"
              {...field}
            />
          )}
        </Field>
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

        <Field
          label="Earliest start date"
          htmlFor="goals-start"
          hint="Helps us surface opportunities with deadlines that still work."
        >
          {(field) => (
            <TextInput
              id="goals-start"
              type="text"
              value={goals?.startBy ?? ""}
              onChange={(value) => setGoals({ startBy: value === "" ? undefined : value })}
              placeholder="2027-09-01"
              {...field}
            />
          )}
        </Field>
      </div>
    </div>
  );
}

/** Step 6: clear-the-demo helper. */
export function ResetStep() {
  const { profile, clear } = useProfile();

  const answered = useMemo(() => {
    if (profile.academic === undefined) return 0;
    return Object.keys(profile.academic).length;
  }, [profile.academic]);

  return (
    <div className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Saved profile</h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        Your profile is stored in this browser only. There is no account, and
        nothing is sent to a server.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={clear}>
          Clear profile
        </Button>
        <span className="text-sm text-mist-500">
          {answered === 0 ? "Nothing saved yet." : `${answered} academic field(s) saved.`}
        </span>
      </div>
    </div>
  );
}