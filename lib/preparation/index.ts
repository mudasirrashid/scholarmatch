/**
 * Application readiness and preparation planning.
 *
 * Phase 06 reads the same canonical `Scholarship` record, the same
 * `StudentProfile` and the same engine `MatchResult` that the match surfaces
 * use, and turns them into a preparation checklist, a readiness figure and a
 * deterministic action plan. It scores nothing: the match is the engine's
 * work; this module spells out what is left to do before applying.
 *
 * ## Status vocabulary
 *
 * A preparation item never claims more than the profile has evidenced:
 *
 * - `satisfied`    the profile evidences the requirement is covered;
 * - `known`        the profile indicates the relevant preparation exists;
 * - `unknown`      the profile records nothing about it. This is phrased as
 *                  "preparation status not provided", which is a different
 *                  fact from "this is missing" and is never asserted as such;
 * - `not_met`      the profile evidences a shortfall;
 * - `not_required` the item does not apply to this application.
 *
 * ## Readiness figure
 *
 * Readiness is the share of applicable requirements that are accounted for
 * (satisfied or known). Optional and conditional documents never count
 * against it because they are not mandatory; a required document counts
 * against it while the profile records nothing about it, which is the honest
 * gap this phase exists to surface. A strong match and a finished
 * application are therefore different things by design.
 *
 * Everything here is pure and deterministic: the same record, profile and
 * match always produce the same assessment. Deadline arithmetic uses the
 * shared reference date rather than a clock, so a server-rendered figure can
 * never disagree with a hydrated one.
 */

import { formatDeadline, formatExactDate, formatOpenDeadline, isUrgent } from "@/lib/format";
import { evaluateAcademic, evaluateLanguage } from "@/lib/matching/eligibility";
import { daysUntil } from "@/lib/scholarships/preview";

import type { LanguageVerdict } from "@/lib/matching/eligibility";
import type { MatchResult } from "@/types/matching";
import type { RequiredDocument, Scholarship } from "@/types/scholarship";
import type { StudentProfile } from "@/types/student";

export type PreparationStatus =
  | "satisfied"
  | "known"
  | "unknown"
  | "not_met"
  | "not_required";

export type PreparationCategory =
  | "eligibility"
  | "academic"
  | "identity"
  | "language"
  | "experience"
  | "writing"
  | "recommendations"
  | "research"
  | "creative"
  | "application";

export type RequiredMark = "required" | "optional" | "conditional";

export interface PreparationRequirement {
  id: string;
  category: PreparationCategory;
  label: string;
  requirement: RequiredMark;
  status: PreparationStatus;
  /** One honest sentence explaining the status. */
  detail: string | null;
}

export type ReadinessLevel =
  | "ready"
  | "nearly_ready"
  | "preparation_needed"
  | "eligibility_issue"
  | "information_needed";

export interface DeadlineAwareness {
  kind: "exact" | "rolling" | "varies" | "unknown";
  /** Whole days remaining from the shared reference date, when exact. */
  daysRemaining: number | null;
  /** True when an exact deadline is 1-21 days away. */
  urgent: boolean;
  /** Short human label, e.g. "14 days left (20 Oct 2026)". */
  label: string;
}

export type PreparationPriority = "critical" | "high" | "medium" | "low";

export interface PreparationPlanStep {
  id: string;
  priority: PreparationPriority;
  title: string;
  detail: string;
}

export interface ReadinessAssessment {
  level: ReadinessLevel;
  /** Readiness percentage, 0-100, computed as accounted over applicable. */
  percent: number;
  accounted: number;
  applicable: number;
  /** Applicable requirements that still need attention. */
  attention: number;
  summary: string;
  eligibilityLabel: string;
  requirements: readonly PreparationRequirement[];
  deadline: DeadlineAwareness;
  plan: readonly PreparationPlanStep[];
}

/** Display label for a preparation category. */
export const PREPARATION_CATEGORY_LABEL: Readonly<Record<PreparationCategory, string>> = {
  eligibility: "Eligibility",
  academic: "Academic",
  identity: "Identity",
  language: "Language",
  experience: "Experience",
  writing: "Writing",
  recommendations: "Recommendations",
  research: "Research",
  creative: "Creative",
  application: "Application",
};

/** Short display label for a preparation status. */
export const PREPARATION_STATUS_LABEL: Readonly<Record<PreparationStatus, string>> = {
  satisfied: "Covered",
  known: "In hand",
  unknown: "Not verified",
  not_met: "Shortfall",
  not_required: "Not required",
};

/** Short display label for a readiness level. */
export const READINESS_LEVEL_LABEL: Readonly<Record<ReadinessLevel, string>> = {
  ready: "Ready to apply",
  nearly_ready: "Nearly ready",
  preparation_needed: "Preparation needed",
  eligibility_issue: "Eligibility issue",
  information_needed: "Information needed",
};

/** Short display label for an action-plan priority. */
export const PREPARATION_PRIORITY_LABEL: Readonly<Record<PreparationPriority, string>> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/* ==========================================================================
   Document categorisation
   --------------------------------------------------------------------------
   Documents arrive as a flat provider list; their preparation group is derived
   from the document's own id and label, never from a hidden per-record map.
   ========================================================================== */

const CATEGORY_KEYWORDS: ReadonlyArray<readonly [PreparationCategory, readonly string[]]> = [
  [
    "identity",
    ["passport", "national id", "id card", "citizenship", "proof of identity"],
  ],
  [
    "academic",
    ["transcript", "degree certificate", "degree-certificate", "enrolment", "enrollment", "academic record"],
  ],
  ["language", ["english", "language", "ielts", "toefl", "duolingo", "proficiency"]],
  ["experience", ["cv", "curriculum vitae", "resume", "work experience"]],
  ["research", ["research proposal", "research statement", "proposal", "publication"]],
  ["recommendations", ["reference", "recommendation", "referee"]],
  ["creative", ["portfolio", "showreel", "demo reel", "reel", "audition"]],
  ["writing", ["statement", "motivation", "essay", "letter of intent", "personal statement"]],
] as const;

function categoryFor(document: RequiredDocument): PreparationCategory {
  const haystack = `${document.id} ${document.label}`.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }
  // A document that matches nothing known yet is presented under a neutral
  // bucket rather than being guessed into the wrong one.
  return "application";
}

/* ==========================================================================
   Status derivation
   --------------------------------------------------------------------------
   Each status is a fact about what the profile records, not an opinion.
   ========================================================================== */

function languageVerdictToStatus(verdict: LanguageVerdict): PreparationStatus {
  switch (verdict) {
    case "not_required":
      return "not_required";
    case "meets":
      return "satisfied";
    case "below":
      return "not_met";
    default:
      return "unknown";
  }
}

/** One sentence summarising what the profile records about academic history. */
function academicEvidence(profile: StudentProfile): string | null {
  const { currentDegree, university, graduationYear } = profile.academic ?? {};
  const bits: string[] = [];
  if (currentDegree) bits.push(`${currentDegree.replace("_", " ")}`);
  if (university) bits.push(`at ${university}`);
  if (graduationYear !== undefined) bits.push(`graduating ${graduationYear}`);
  return bits.length > 0 ? `Your profile records ${bits.join(" ")}.` : null;
}

/** One sentence summarising what the profile records about experience. */
function experienceEvidence(profile: StudentProfile): string | null {
  const { workExperienceYears, researchExperienceYears, leadershipExperience } =
    profile.experience ?? {};
  const bits: string[] = [];
  if (workExperienceYears !== undefined)
    bits.push(`${workExperienceYears} year${workExperienceYears === 1 ? "" : "s"} of work experience`);
  if (researchExperienceYears !== undefined)
    bits.push(`${researchExperienceYears} year${researchExperienceYears === 1 ? "" : "s"} of research experience`);
  if (leadershipExperience !== undefined)
    bits.push(leadershipExperience ? "leadership experience" : "no leadership experience");
  return bits.length > 0 ? `Your profile records ${bits.join(", ")}.` : null;
}

/**
 * Whether the profile evidences a document is in hand.
 *
 * Only two families can be inferred from the profile without overclaiming: an
 * academic record implies transcripts and a degree certificate exist, and a
 * recorded experience history implies a CV could evidence it. Everything else
 * (identity, writing, references, research, creative work) stays `unknown`
 * because the profile records nothing about it.
 */
function documentStatus(
  document: RequiredDocument,
  profile: StudentProfile,
  language: LanguageVerdict,
): PreparationStatus {
  if (document.requirement !== "required") return "not_required";

  switch (categoryFor(document)) {
    case "language":
      return languageVerdictToStatus(language);
    case "academic": {
      const academic = profile.academic;
      const recorded =
        academic !== undefined &&
        (academic.currentDegree !== undefined ||
          academic.university !== undefined ||
          academic.graduationYear !== undefined);
      return recorded ? "known" : "unknown";
    }
    case "experience": {
      const experience = profile.experience;
      const recorded =
        experience !== undefined &&
        (experience.workExperienceYears !== undefined ||
          experience.researchExperienceYears !== undefined ||
          experience.leadershipExperience !== undefined);
      return recorded ? "known" : "unknown";
    }
    default:
      return "unknown";
  }
}

const UNKNOWN_DOCUMENT_DETAIL =
  "Required by the provider. Your profile does not yet record that this is in hand — preparation status not provided.";

function documentDetail(
  document: RequiredDocument,
  profile: StudentProfile,
  language: LanguageVerdict,
): string | null {
  if (document.requirement !== "required") {
    const base = document.requirement === "conditional" ? "Required only in some cases." : "Not mandatory.";
    return document.note ? `${base} ${document.note}` : base;
  }

  const status = documentStatus(document, profile, language);
  if (status === "known") {
    const evidence =
      categoryFor(document) === "academic"
        ? academicEvidence(profile)
        : categoryFor(document) === "experience"
          ? experienceEvidence(profile)
          : null;
    return evidence ?? UNKNOWN_DOCUMENT_DETAIL;
  }

  if (status === "satisfied") {
    return `The provider accepts your recorded language test score for ${document.label}.`;
  }

  if (status === "not_met") {
    return "Your recorded test score is below the minimum the provider publishes for this document.";
  }

  if (document.note) return `${UNKNOWN_DOCUMENT_DETAIL} ${document.note}`;
  return UNKNOWN_DOCUMENT_DETAIL;
}

/* ==========================================================================
   Item builders
   --------------------------------------------------------------------------
   Each requirement is a pure projection of the record + profile + match.
   ========================================================================== */

function eligibilityItem(result: MatchResult): PreparationRequirement {
  if (!result.eligibility.isEligible) {
    const failures = result.eligibility.hardFailures.join(" and ");
    return {
      id: "eligibility",
      category: "eligibility",
      label: "Meet the published eligibility rules",
      requirement: "required",
      status: "not_met",
      detail: failures
        ? `Your profile fails a hard requirement the provider publishes (${failures}). This award is not open to you as your profile stands.`
        : "Your profile fails a hard requirement the provider publishes.",
    };
  }

  if (result.eligibility.unknownRequirements.length > 0) {
    const labels = result.eligibility.unknownRequirements
      .slice(0, 3)
      .map((requirement) => requirement.label)
      .join(", ");
    return {
      id: "eligibility",
      category: "eligibility",
      label: "Meet the published eligibility rules",
      requirement: "required",
      status: "unknown",
      detail: `Your profile does not yet answer every published requirement (${labels}${result.eligibility.unknownRequirements.length > 3 ? ", …" : ""}).`,
    };
  }

  return {
    id: "eligibility",
    category: "eligibility",
    label: "Meet the published eligibility rules",
    requirement: "required",
    status: "satisfied",
    detail: "Every published hard requirement is met by your profile.",
  };
}

/**
 * The academic floor, when the provider publishes one.
 *
 * A numeric floor is compared against the profile's GPA. A provider-stated
 * requirement in the provider's own terms ("2:1", "%70") cannot be checked
 * against a raw GPA without guessing, so it stays `unknown` with a prompt to
 * compare the transcript manually. `gpa === 0` means no floor exists and the
 * item is skipped entirely.
 */
function academicItem(scholarship: Scholarship, profile: StudentProfile): PreparationRequirement | null {
  if (scholarship.gpa === 0) return null;

  if (scholarship.gpa === null) {
    return {
      id: "academic",
      category: "academic",
      label: "Meet the academic requirement",
      requirement: "required",
      status: "unknown",
      detail: `The provider states the academic requirement as "${scholarship.gpaLabel}" in its own terms, so it cannot be checked against a raw GPA. Compare your transcript with the official page.`,
    };
  }

  const gpa = profile.academic?.gpa;
  const verdict = evaluateAcademic(gpa, scholarship.gpa);
  switch (verdict) {
    case "exceeds":
    case "meets":
      return {
        id: "academic",
        category: "academic",
        label: "Meet the academic requirement",
        requirement: "required",
        status: "satisfied",
        detail: `Your GPA of ${gpa?.toFixed(2) ?? "—"} clears the published ${scholarship.gpaLabel} floor.`,
      };
    case "close":
      return {
        id: "academic",
        category: "academic",
        label: "Meet the academic requirement",
        requirement: "required",
        status: "unknown",
        detail: `Your GPA of ${gpa?.toFixed(2) ?? "—"} sits just below the published ${scholarship.gpaLabel} floor — worth confirming with the provider.`,
      };
    case "below":
      return {
        id: "academic",
        category: "academic",
        label: "Meet the academic requirement",
        requirement: "required",
        status: "not_met",
        detail: `Your GPA of ${gpa?.toFixed(2) ?? "—"} is below the published ${scholarship.gpaLabel} floor.`,
      };
    default:
      return {
        id: "academic",
        category: "academic",
        label: "Meet the academic requirement",
        requirement: "required",
        status: "unknown",
        detail: `The provider publishes a ${scholarship.gpaLabel} floor; your profile has not recorded a GPA yet.`,
      };
  }
}

function languageItem(scholarship: Scholarship, profile: StudentProfile): PreparationRequirement | null {
  if (scholarship.languageTests.length === 0) return null;

  const tests = scholarship.languageTests.map((test) => test.toUpperCase()).join(" or ");
  const verdict = evaluateLanguage(profile.eligibility?.languageTests, scholarship);
  const status = languageVerdictToStatus(verdict);

  let detail: string;
  switch (verdict) {
    case "meets":
      detail = `Your saved score clears the published minimum for ${tests}.`;
      break;
    case "below":
      detail = `Your saved score is below the published minimum for ${tests}.`;
      break;
    case "unverified":
      detail = `You have not recorded a score for ${tests}; the provider notes waivers may apply.`;
      break;
    case "not_required":
    case "unknown":
    default:
      detail = `Your profile has not recorded a score for ${tests} yet.`;
      break;
  }

  return {
    id: "language",
    category: "language",
    label: `Meet the language requirement (${tests})`,
    requirement: "required",
    status,
    detail,
  };
}

function deadlineItem(scholarship: Scholarship, deadline: DeadlineAwareness): PreparationRequirement {
  const known = deadline.kind !== "unknown";
  return {
    id: "deadline",
    category: "application",
    label: "Know the application deadline",
    requirement: "required",
    status: known ? "satisfied" : "unknown",
    detail: known
      ? `${deadline.label}${scholarship.deadlineNote ? ` — ${scholarship.deadlineNote}` : ""}.`
      : "The provider has not published a closing date; confirm it on the official page.",
  };
}

function guidanceItem(scholarship: Scholarship): PreparationRequirement {
  const hasGuidance = scholarship.howToApply.length > 0 || Boolean(scholarship.officialSource.applicationUrl);
  return {
    id: "application-guidance",
    category: "application",
    label: "Know how to apply",
    requirement: "required",
    status: hasGuidance ? "satisfied" : "unknown",
    detail: hasGuidance
      ? scholarship.howToApply.length > 0
        ? `${scholarship.howToApply.length} step${scholarship.howToApply.length === 1 ? " is" : "s are"} published; submission happens on the awarding body's own portal.`
        : "An application link is published on the official page."
      : "No verified application route is published yet; confirm on the awarding body's own site.",
  };
}

function documentItems(
  scholarship: Scholarship,
  profile: StudentProfile,
  language: LanguageVerdict,
): PreparationRequirement[] {
  return scholarship.documents.map((document) => ({
    id: `doc:${document.id}`,
    category: categoryFor(document),
    label: document.label,
    requirement: document.requirement,
    status: documentStatus(document, profile, language),
    detail: documentDetail(document, profile, language),
  }));
}

/* ==========================================================================
   Deadline awareness
   --------------------------------------------------------------------------
   Reuses the shared reference date and format helpers so an exact deadline is
   counted in whole days the same way the explorer counts it.
   ========================================================================== */

export function assessDeadline(scholarship: Scholarship): DeadlineAwareness {
  if (scholarship.deadline !== null) {
    const daysRemaining = daysUntil(scholarship.deadline);
    const label =
      daysRemaining === null
        ? formatExactDate(scholarship.deadline)
        : `${formatDeadline(daysRemaining)} (${formatExactDate(scholarship.deadline)})`;
    return {
      kind: "exact",
      daysRemaining,
      urgent: daysRemaining !== null && isUrgent(daysRemaining),
      label,
    };
  }

  switch (scholarship.deadlineKind) {
    case "rolling":
      return { kind: "rolling", daysRemaining: null, urgent: false, label: formatOpenDeadline("rolling") };
    case "varies":
      return { kind: "varies", daysRemaining: null, urgent: false, label: formatOpenDeadline("varies") };
    case "unknown":
      return { kind: "unknown", daysRemaining: null, urgent: false, label: "Deadline not currently verified" };
    default:
      return { kind: "unknown", daysRemaining: null, urgent: false, label: "Deadline not currently verified" };
  }
}

/* ==========================================================================
   Action plan
   --------------------------------------------------------------------------
   Ordered deterministically by priority, then by category. The steps are all
   derived from the assessment above so the checklist and the plan never
   disagree about what needs doing.
   ========================================================================== */

const PRIORITY_RANK: Readonly<Record<PreparationPriority, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CATEGORY_RANK: Readonly<Record<PreparationCategory, number>> = {
  eligibility: 0,
  academic: 1,
  identity: 2,
  language: 3,
  experience: 4,
  writing: 5,
  recommendations: 6,
  research: 7,
  creative: 8,
  application: 9,
};

function buildPlan(
  scholarship: Scholarship,
  result: MatchResult,
  requirements: readonly PreparationRequirement[],
  deadline: DeadlineAwareness,
): PreparationPlanStep[] {
  const steps: PreparationPlanStep[] = [];

  if (!result.eligibility.isEligible) {
    steps.push({
      id: "confirm-eligibility",
      priority: "critical",
      title: "Fix your eligibility",
      detail: "Your profile fails a hard requirement this award publishes, so preparation alone will not open the door. Confirm the rules on the official page first.",
    });
  } else if (result.eligibility.unknownRequirements.length > 0) {
    steps.push({
      id: "confirm-eligibility",
      priority: "high",
      title: "Confirm the remaining eligibility requirements",
      detail: "Your profile has not yet answered everything the provider publishes. Update it so nothing is left to chance.",
    });
  } else {
    steps.push({
      id: "confirm-eligibility",
      priority: "medium",
      title: "Eligibility confirmed",
      detail: "Nothing on eligibility needs attention before you apply.",
    });
  }

  if (deadline.kind === "exact") {
    if (deadline.daysRemaining !== null && deadline.daysRemaining <= 0) {
      steps.push({
        id: "meet-deadline",
        priority: "critical",
        title: "Deadline passed",
        detail: `Applications closed on ${scholarship.deadline ?? "the published date"}. Check the provider for the next cycle.`,
      });
    } else if (deadline.urgent) {
      steps.push({
        id: "meet-deadline",
        priority: "critical",
        title: `Apply by ${formatExactDate(scholarship.deadline ?? "")}`,
        detail: `${deadline.label}. Start the official application this week — documents below move slower than deadlines do.`,
      });
    } else {
      steps.push({
        id: "meet-deadline",
        priority: "medium",
        title: `Apply by ${formatExactDate(scholarship.deadline ?? "")}`,
        detail: `${deadline.label}. Request transcripts and references early; they depend on other people.`,
      });
    }
  } else if (deadline.kind === "rolling") {
    steps.push({
      id: "meet-deadline",
      priority: "medium",
      title: "Apply early",
      detail: "Applications are reviewed as they arrive, so earlier is materially better than waiting.",
    });
  } else {
    steps.push({
      id: "meet-deadline",
      priority: "medium",
      title: "Confirm the deadline",
      detail: "The provider has not published a closing date; check the official page before planning around one.",
    });
  }

  const documents = requirements
    .filter((requirement) => requirement.id.startsWith("doc:") && requirement.requirement === "required")
    .filter((requirement) => requirement.status === "unknown" || requirement.status === "not_met")
    .slice()
    .sort(
      (a, b) =>
        CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category] ||
        a.label.localeCompare(b.label),
    );

  for (const document of documents) {
    steps.push({
      id: `prepare-${document.id}`,
      priority: "high",
      title: `Prepare ${document.label}`,
      detail: document.detail ?? UNKNOWN_DOCUMENT_DETAIL,
    });
  }

  const language = requirements.find((requirement) => requirement.id === "language");
  if (language?.status === "not_met") {
    steps.push({
      id: "meet-language",
      priority: "critical",
      title: "Meet the language requirement",
      detail: language.detail ?? "",
    });
  } else if (language?.status === "unknown") {
    steps.push({
      id: "record-language",
      priority: "medium",
      title: "Record your language test score",
      detail: language.detail ?? "",
    });
  }

  const optional = requirements.filter(
    (requirement) => requirement.id.startsWith("doc:") && requirement.requirement !== "required",
  );
  if (optional.length > 0) {
    steps.push({
      id: "optional-documents",
      priority: "low",
      title: "Optional documents",
      detail: `Only prepare if they apply to you: ${optional.map((document) => document.label).join(", ")}.`,
    });
  }

  if (scholarship.officialSource.applicationUrl) {
    steps.push({
      id: "submit-application",
      priority: deadline.urgent ? "critical" : "high",
      title: "Submit on the official portal",
      detail: "Submissions happen on the awarding body's own portal; ScholarMatch never submits for you. The Apply now button at the top of this page links straight there.",
    });
  } else if (scholarship.howToApply.length > 0) {
    steps.push({
      id: "submit-application",
      priority: deadline.urgent ? "high" : "medium",
      title: "Follow the published application steps",
      detail: `${scholarship.howToApply.length} step${scholarship.howToApply.length === 1 ? " is" : "s are"} listed in the How to apply section of this page.`,
    });
  } else {
    steps.push({
      id: "submit-application",
      priority: "medium",
      title: "Confirm how to apply",
      detail: "No verified application route is published yet; check the awarding body's own site.",
    });
  }

  return steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => PRIORITY_RANK[a.step.priority] - PRIORITY_RANK[b.step.priority] || a.index - b.index)
    .map(({ step }) => step);
}

/* ==========================================================================
   Top-level assessment
   ========================================================================== */

function readinessLevel(eligibilityStatus: PreparationStatus, percent: number): ReadinessLevel {
  if (eligibilityStatus === "not_met") return "eligibility_issue";
  if (eligibilityStatus === "unknown") return "information_needed";
  if (percent >= 85) return "ready";
  if (percent >= 55) return "nearly_ready";
  return "preparation_needed";
}

function readinessSummary(level: ReadinessLevel, accounted: number, applicable: number, attention: number): string {
  switch (level) {
    case "eligibility_issue":
      return "This award is not open to your profile as it stands.";
    case "information_needed":
      return "Your profile does not yet answer every requirement this award checks.";
    default:
      if (attention === 0) return "Every known preparation requirement is accounted for.";
      return `${accounted} of ${applicable} known preparation requirement${applicable === 1 ? "" : "s"} are accounted for — ${attention} required item${attention === 1 ? "" : "s"} still need attention.`;
  }
}

function eligibilityLabel(status: PreparationStatus): string {
  switch (status) {
    case "satisfied":
    case "known":
      return "Eligibility confirmed";
    case "not_met":
      return "Eligibility issue";
    default:
      return "Eligibility pending";
  }
}

/**
 * Assesses how ready one student is to apply for one award.
 *
 * `result` is the matching engine's own `MatchResult` for this profile and
 * record, so the readiness judgement never recomputes eligibility or scoring
 * with different rules.
 */
export function assessReadiness(
  scholarship: Scholarship,
  profile: StudentProfile,
  result: MatchResult,
): ReadinessAssessment {
  const language = evaluateLanguage(profile.eligibility?.languageTests, scholarship);
  const deadline = assessDeadline(scholarship);

  const academic = academicItem(scholarship, profile);
  const languageRequirement = languageItem(scholarship, profile);

  const requirements: PreparationRequirement[] = [
    eligibilityItem(result),
    ...(academic ? [academic] : []),
    ...(languageRequirement ? [languageRequirement] : []),
    deadlineItem(scholarship, deadline),
    guidanceItem(scholarship),
    ...documentItems(scholarship, profile, language),
  ];

  const accounted = requirements.filter(
    (requirement) => requirement.status === "satisfied" || requirement.status === "known",
  ).length;
  const applicable = requirements.filter((requirement) => requirement.status !== "not_required").length;
  const attention = requirements.filter(
    (requirement) => requirement.status === "unknown" || requirement.status === "not_met",
  ).length;
  const percent = applicable === 0 ? 100 : Math.round((accounted / applicable) * 100);

  const eligibilityStatus = requirements.find((requirement) => requirement.id === "eligibility")?.status ?? "unknown";
  const level = readinessLevel(eligibilityStatus, percent);

  return {
    level,
    percent,
    accounted,
    applicable,
    attention,
    summary: readinessSummary(level, accounted, applicable, attention),
    eligibilityLabel: eligibilityLabel(eligibilityStatus),
    requirements,
    deadline,
    plan: buildPlan(scholarship, result, requirements, deadline),
  };
}