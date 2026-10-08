"use client";

import { useState } from "react";

import {
  AcademicStep,
  EligibilityStep,
  ExperienceStep,
  GoalsStep,
  PreferencesStep,
  ResetStep,
} from "@/components/profile/steps";
import { ProfileProvider, useProfile } from "@/components/profile/profile-provider";
import { MatchPanel, useProfileMatches } from "@/components/profile/match-panel";
import { AmbientField } from "@/components/ui/ambient-field";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Container } from "@/components/ui/container";
import { demoProfiles, isDemoProfile } from "@/lib/demo/student-profiles";
import { profileCompletion } from "@/lib/profile/completion";
import { cn } from "@/lib/cn";

import type { CompletionGap, ProfileCompletion } from "@/lib/profile/completion";
import type { ProfileSectionId } from "@/types/student";
import type { StudentProfile } from "@/types/student";

/**
 * Profile builder.
 *
 * Six steps over a single stored profile. Progress is explicit rather than
 * implied by scrolling, because the questions build on each other: a student who
 * skips the academic section should know that is why their scores read low.
 *
 * The whole flow is one client island. That is the honest shape for this phase:
 * the profile lives in `localStorage`, so there is nothing for the server to
 * render that would not be wrong by the time it reached the browser. When
 * accounts arrive the shell can be server-rendered around the same form.
 */
export function ProfileBuilder() {
  return (
    <ProfileProvider>
      <ProfileBuilderInner />
    </ProfileProvider>
  );
}

const STEPS: readonly { id: ProfileSectionId; label: string }[] = [
  { id: "academic", label: "Academic" },
  { id: "eligibility", label: "Eligibility" },
  { id: "experience", label: "Experience" },
  { id: "preferences", label: "Preferences" },
  { id: "goals", label: "Goals" },
  { id: "review", label: "Review" },
];

function ProfileBuilderInner() {
  const { profile, isHydrated, isUnreadable, replace, clear } = useProfile();
  const [step, setStep] = useState<ProfileSectionId>("academic");

  const results = useProfileMatches(profile);
  const completion = profileCompletion(profile);

  const index = STEPS.findIndex((entry) => entry.id === step);
  const current = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-10 sm:pt-36 lg:pt-40">
        <AmbientField />
        <Container size="wide" className="relative">
          <Eyebrow>Your profile</Eyebrow>
          <h1 className="mt-6 max-w-3xl font-display text-[2.25rem] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl lg:text-[3.75rem]">
            Tell us what you have, and we will score it honestly.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
            Every answer is checked against the requirements a provider actually
            publishes. Leave a field blank and we will say so rather than guess.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            {/*
              Three states, because the visitor has to be able to tell what they
              are looking at. The badge used to read "Demo profile"
              unconditionally, which told someone with their own saved profile that
              everything they had entered was sample data, and told someone looking
              at a demo that their own answers had simply vanished.

              Nothing is asserted before hydration. The server has no stored
              profile, so it can only ever report zero answers, and saying so would
              tell a returning visitor their profile is empty for as long as the
              bundle takes to load.
            */}
            {isHydrated ? (
              isDemoProfile(profile) ? (
                <Badge tone="caution">Demo profile loaded</Badge>
              ) : completion.answeredCount > 0 ? (
                <Badge tone="neutral">Your own answers</Badge>
              ) : (
                <Badge tone="neutral">Nothing saved yet</Badge>
              )
            ) : null}
            <Badge tone="neutral">Saved in this browser only</Badge>
          </div>
        </Container>
      </section>

      <Container size="wide">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
          <div className="min-w-0">
            {isUnreadable ? <UnreadableProfileNotice onRebuild={clear} /> : null}

            {/* Step navigation as a real list, so the count is announced. */}
            <nav aria-label="Profile steps">
              <ol className="flex flex-wrap gap-2">
                {STEPS.map((entry, position) => {
                  const isCurrent = entry.id === step;
                  const isVisited = position <= index;

                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => setStep(entry.id)}
                        aria-current={isCurrent ? "step" : undefined}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-[0.8125rem] transition-colors duration-200",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
                          isCurrent
                            ? "bg-mist-50 text-ink-950"
                            : isVisited
                              ? "bg-white/[0.07] text-mist-200 hover:bg-white/[0.11]"
                              : "text-mist-500 hover:bg-white/[0.05] hover:text-mist-300",
                        )}
                      >
                        <span className="font-mono text-[0.6875rem] opacity-60">
                          {String(position + 1).padStart(2, "0")}
                        </span>
                        <span className="ml-1.5">{entry.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <p aria-live="polite" className="mt-4 text-sm text-mist-500">
              Step {index + 1} of {STEPS.length}: {current?.label}
            </p>

            <div className="mt-5">
              <StepPanel step={step} profile={profile} onDemo={replace} />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                disabled={index === 0}
                onClick={() => setStep(STEPS[Math.max(0, index - 1)]?.id ?? "academic")}
              >
                Back
              </Button>

              {isLast ? (
                <>
                  <Button href="/matches">See my matches</Button>
                  <Button href="/scholarships" variant="secondary">
                    Browse opportunities
                  </Button>
                </>
              ) : (
                <Button onClick={() => setStep(STEPS[index + 1]?.id ?? "review")}>
                  Continue
                </Button>
              )}

              {isHydrated ? (
                <ConfirmAction
                  label="Start over"
                  confirmLabel="Yes, clear it"
                  question="This permanently removes every answer stored in this browser. It cannot be undone."
                  onConfirm={() => {
                    clear();
                    setStep("academic");
                  }}
                />
              ) : null}
            </div>
          </div>

          {/* The panel stays beside the form so a change is visible immediately. */}
          <div className="min-w-0 lg:sticky lg:top-24">
            <MatchPanel results={results} isHydrated={isHydrated} />
          </div>
        </div>
      </Container>
    </>
  );
}

/**
 * Renders the active step.
 *
 * A switch rather than six mounted sections, so off-screen controls are never
 * reachable by keyboard and nothing is submitted from a hidden field.
 */
function StepPanel({
  step,
  profile,
  onDemo,
}: {
  step: ProfileSectionId;
  profile: StudentProfile;
  onDemo: (profile: StudentProfile) => void;
}) {
  switch (step) {
    case "academic":
      return <AcademicStep />;
    case "eligibility":
      return <EligibilityStep />;
    case "experience":
      return <ExperienceStep />;
    case "preferences":
      return <PreferencesStep />;
    case "goals":
      return <GoalsStep />;
    case "review":
      return (
        <>
          <ReviewStep />
          <DemoProfiles onDemo={onDemo} current={profile} />
        </>
      );
  }
}

/** Step name for each profile section, so a gap says where to go. */
const SECTION_LABELS: Record<CompletionGap["section"], string> = {
  academic: "Academic",
  eligibility: "Eligibility",
  experience: "Experience",
  preferences: "Preferences",
};

/**
 * Review step.
 *
 * States what the engine actually resolved rather than echoing the form back.
 * That distinction is the point: a student should be able to see which answers
 * are being used and which are being ignored.
 */
function ReviewStep() {
  const { profile, isHydrated } = useProfile();
  const completion = profileCompletion(profile);

  const answered = [
    ["GPA", profile.academic?.gpa?.toFixed(2)],
    ["Current degree", profile.academic?.currentDegree],
    ["Field of study", profile.academic?.fieldOfStudy],
    ["Graduation year", profile.academic?.graduationYear],
    ["Citizenship", profile.eligibility?.citizenship],
    ["Work authorisation", profile.eligibility?.workAuthorization],
    ["IELTS", profile.eligibility?.languageTests?.ielts],
    ["TOEFL", profile.eligibility?.languageTests?.toefl],
    ["Work experience", profile.experience?.workExperienceYears],
    ["Research experience", profile.experience?.researchExperienceYears],
    ["Target degree", profile.preferences?.preferredDegree],
    ["Funding preference", profile.preferences?.fundingPreference],
    ["Study mode", profile.preferences?.studyMode],
    ["Destinations", profile.preferences?.preferredCountries?.join(", ")],
  ].filter((entry): entry is [string, string | number] => entry[1] !== undefined);

  const essentialGaps = completion.gaps.filter((gap) => gap.tier === "essential");
  const helpfulGaps = completion.gaps.filter((gap) => gap.tier === "helpful");

  return (
    <div className="surface-glass edge-highlight rounded-2xl p-6 sm:p-7">
      <h2 className="font-display text-2xl font-normal tracking-[-0.02em] text-mist-50 sm:text-3xl">
        What we will use
      </h2>
      <p className="mt-2.5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-mist-400">
        These answers are the only inputs to your match score.
      </p>

      <CompletionMeter completion={completion} isHydrated={isHydrated} />

      {answered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-relaxed text-mist-300">
          Nothing answered yet. Scores below are based on what the records say
          about themselves, not about you, so treat them as provisional.
        </p>
      ) : (
        <dl className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {answered.map(([label, value]) => (
            <div key={label} className="min-w-0 border-b border-hairline-soft pb-2.5">
              <dt className="text-xs text-mist-500">{label}</dt>
              <dd className="mt-1 text-sm text-mist-100">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {/*
        Gaps come from the profile-wide completion calculation rather than from a
        single match result. The engine's own missing-information list only covers
        the best result, so a student with an unanswered work authorisation would
        not see it listed there at all if their top match happened not to care.
      */}
      {completion.gaps.length > 0 ? (
        <div className="mt-7 rounded-xl border border-hairline-soft bg-white/[0.03] p-4">
          <h3 className="text-sm font-medium text-mist-100">
            What would sharpen these scores
          </h3>

          {essentialGaps.length > 0 ? (
            <>
              <p className="mt-2 text-xs text-mist-500">
                Needed before your eligibility can be decided:
              </p>
              <GapList gaps={essentialGaps} />
            </>
          ) : null}

          {helpfulGaps.length > 0 ? (
            <>
              <p className="mt-4 text-xs text-mist-500">
                Improves how closely each result fits:
              </p>
              <GapList gaps={helpfulGaps} />
            </>
          ) : null}
        </div>
      ) : null}

      <ResetStep />
    </div>
  );
}

/**
 * Completion readout.
 *
 * Leads with the essential questions rather than a single percentage. One number
 * cannot tell the difference between a profile that has answered everything the
 * engine can act on and one that has answered a third of it, which is the
 * difference between a ranking worth reading and a provisional one.
 *
 * Held back until hydration for the same reason the match panel is: the server can
 * only ever see an empty profile, so a percentage rendered during SSR would be a
 * confident "0%" for someone who has a full profile saved.
 */
function CompletionMeter({ completion, isHydrated }: { completion: ProfileCompletion; isHydrated: boolean }) {
  if (!isHydrated) {
    return (
      <div className="mt-6 h-[5.125rem] rounded-xl border border-hairline-soft bg-white/[0.03]" aria-busy="true">
        <span className="sr-only">Reading your saved profile.</span>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-hairline-soft bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-mist-300">
          <span className="font-mono text-mist-50">{completion.percent}%</span> of what
          your score depends on is answered
        </p>
        <p className="text-xs text-mist-500">
          {completion.essentialAnswered} of {completion.essentialTotal} essential
          fields answered
        </p>
      </div>

      <div
        role="img"
        aria-label={`${completion.percent} percent of the fields your score depends on are answered.`}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
      >
        <div
          className="h-full rounded-full bg-azure-400/70"
          style={{ width: `${completion.percent}%` }}
        />
      </div>
    </div>
  );
}

/** Gap list, with the step each answer belongs to. */
function GapList({ gaps }: { gaps: readonly CompletionGap[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {gaps.map((gap) => (
        <li key={gap.id} className="flex gap-2.5 text-sm leading-relaxed text-mist-400">
          <span
            className="mt-2 size-1 shrink-0 rounded-full bg-azure-300"
            aria-hidden="true"
          />
          <span>
            <span className="text-mist-200">{gap.label}</span>
            <span className="text-mist-500"> &mdash; {SECTION_LABELS[gap.section]}.</span>{" "}
            {gap.reason}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Recovery notice for a stored profile this build cannot read.
 *
 * `parseStoredProfile` rejects an unknown schema version and any section that
 * fails validation, so this covers hand-edited storage as well as data written by
 * a different build. Showing the empty builder on its own would be misleading: the
 * visitor would rebuild their profile without knowing the old one was still there.
 *
 * The stored value is left untouched until they choose to discard it, because the
 * corrupt data is not necessarily their fault and may still be recoverable by
 * hand.
 */
function UnreadableProfileNotice({ onRebuild }: { onRebuild: () => void }) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
      <h2 className="text-sm font-medium text-mist-50">
        We could not read the profile saved in this browser
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-mist-300">
        Something is stored under this site&rsquo;s profile key that this version does
        not recognise, which usually means it was edited by hand or written by a
        different build. It has been left exactly as it is. You can carry on
        answering questions, which will write a new profile over it, or remove it
        and start clean.
      </p>

      <div className="mt-4">
        <ConfirmAction
          label="Discard it and start clean"
          confirmLabel="Yes, discard it"
          question="The unreadable saved value will be deleted from this browser. It cannot be recovered."
          onConfirm={onRebuild}
        />
      </div>
    </div>
  );
}

/**
 * Loads one of the demo profiles.
 *
 * Exists so the six engine behaviours in `verify:matching` can be seen in the
 * product rather than only in a test report. Labelled as demo data, because a
 * visitor should never mistake these for real applicants.
 *
 * Loading one replaces the whole profile, so loading it over answers somebody has
 * written takes a confirmation. Swapping one demo for another does not: nothing of
 * the visitor's is at stake.
 */
function DemoProfiles({
  onDemo,
  current,
}: {
  onDemo: (profile: StudentProfile) => void;
  current: StudentProfile;
}) {
  const [pending, setPending] = useState<StudentProfile | null>(null);

  const completion = profileCompletion(current);
  const hasRealAnswers = completion.answeredCount > 0 && !isDemoProfile(current);

  function load(demo: StudentProfile) {
    if (hasRealAnswers) {
      setPending(demo);
      return;
    }

    onDemo({ ...demo });
  }

  return (
    <div className="surface-glass mt-6 rounded-2xl p-6 sm:p-7">
      <h2 className="font-display text-xl text-mist-50">Try a demo profile</h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-mist-400">
        Six illustrative profiles, each built to show a different part of the
        engine. They are not real applicants.
      </p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {demoProfiles.map((demo, position) => {
          const isActive = current.displayName === demo.displayName;

          return (
            <li key={demo.displayName}>
              <button
                type="button"
                onClick={() => load(demo)}
                aria-pressed={isActive}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
                  isActive
                    ? "border-azure-400/50 bg-azure-400/10"
                    : "border-hairline bg-white/[0.03] hover:border-hairline-strong hover:bg-white/[0.06]",
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-[0.6875rem] text-mist-600">
                    {String.fromCharCode(65 + position)}
                  </span>
                  <span className="text-sm text-mist-100">
                    {demo.displayName?.replace(/^Profile [A-F] - /, "")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {pending !== null ? (
        <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
          {/*
            Not `ConfirmAction`: this prompt is already the second step, so it uses
            plain buttons. Two nested confirmations would ask the same question
            twice and leave three ways to back out.
          */}
          <p id="demo-overwrite-warning" className="text-sm leading-relaxed text-mist-300">
            Loading <span className="text-mist-100">{pending.displayName}</span> replaces
            every answer currently saved in this browser. It cannot be undone.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              autoFocus
              aria-describedby="demo-overwrite-warning"
              onClick={() => {
                onDemo({ ...pending });
                setPending(null);
              }}
            >
              Yes, replace it
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              Keep my profile
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}