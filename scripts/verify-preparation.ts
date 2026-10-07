/**
 * Application readiness verification.
 *
 * Phase 06 derives preparation status, a readiness figure and an action plan
 * from the canonical record, the profile and the engine's own match result.
 * This script asserts that those derivations stay deterministic, honest and
 * within bounds:
 *
 *   - a profile that evidences coverage is never reported as short of it;
 *   - a profile that records nothing is reported as "not provided", never as
 *     missivering possession;
 *   - optional and conditional documents never count against readiness;
 *   - the action plan is always ordered by priority.
 */

import { assessDeadline, assessReadiness } from "@/lib/preparation";
import { matchScholarship } from "@/lib/matching";
import { scholarships } from "@/lib/demo/data";
import { profileA, profileB, profileC } from "@/lib/demo/student-profiles";

import type { PreparationPriority } from "@/lib/preparation";
import type { Scholarship } from "@/types/scholarship";
import type { StudentProfile } from "@/types/student";

const GLOBAL_EXCELLENCE = "demo-global-excellence";
let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) {
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      actual:   ${JSON.stringify(actual)}`);
  }
}

function section(title: string) {
  console.log(`\n   ${title}`);
}

function recordById(id: string): Scholarship {
  const record = scholarships.find((scholarship) => scholarship.id === id);
  if (!record) throw new Error(`Missing record: ${id}`);
  return record;
}

/** A copy of a record with selected fields replaced, for scenario fixtures. */
function override(record: Scholarship, patch: Partial<Scholarship>): Scholarship {
  return {
    ...record,
    ...patch,
    officialSource: { ...record.officialSource, ...(patch.officialSource ?? {}) },
  };
}

function resultFor(profile: StudentProfile, scholarship: Scholarship) {
  return matchScholarship(profile, scholarship);
}

function requirementId(assessment: ReturnType<typeof assessReadiness>, id: string) {
  const requirement = assessment.requirements.find((item) => item.id === id);
  if (!requirement) throw new Error(`Missing requirement: ${id}`);
  return requirement;
}

function priorityRank(priority: PreparationPriority): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[priority];
}

function checkPlanOrdered(assessment: ReturnType<typeof assessReadiness>) {
  const ranks = assessment.plan.map((step) => priorityRank(step.priority));
  const ordered = ranks.every((rank, index) => index === 0 || ranks[index - 1] <= rank);
  check("plan is ordered by priority", ordered, true);
}

section("A strong, complete profile on a standard record");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const assessment = assessReadiness(record, profileA, resultFor(profileA, record));

  check("level is nearly_ready for a full profile with unverified documents", assessment.level, "nearly_ready");
  check("readiness percent is accounted over applicable", assessment.percent, 73);
  check("accounted", assessment.accounted, 8);
  check("applicable excludes optional and conditional documents", assessment.applicable, 11);
  check("attention counts only unverified or short items", assessment.attention, 3);

  check("eligibility is satisfied", requirementId(assessment, "eligibility").status, "satisfied");
  check("academic floor is satisfied", requirementId(assessment, "academic").status, "satisfied");
  check("language requirement is satisfied", requirementId(assessment, "language").status, "satisfied");
  check("transcripts are known from the academic record", requirementId(assessment, "doc:transcripts").status, "known");
  check("degree certificate is known from the academic record", requirementId(assessment, "doc:degree-certificate").status, "known");
  check("cv is known from the experience record", requirementId(assessment, "doc:cv").status, "known");
  check("references stay unverified", requirementId(assessment, "doc:references").status, "unknown");
  check("optional language certificate is not counted", requirementId(assessment, "doc:language").status, "not_required");

  check(
    "summary states the accounted/total ratio and the attention count",
    assessment.summary,
    "8 of 11 known preparation requirements are accounted for \u2014 3 required items still need attention.",
  );

  checkPlanOrdered(assessment);
  check("uncovered documents lead the plan", assessment.plan[0]?.id, "prepare-doc:passport");
  check("sop appears in the plan", assessment.plan.some((step) => step.id === "prepare-doc:sop"), true);
  check("covered documents do not appear in the plan", assessment.plan.some((step) => step.id === "prepare-doc:transcripts"), false);

  check("assessment is deterministic", JSON.stringify(assessment), JSON.stringify(assessReadiness(record, profileA, resultFor(profileA, record))));
}

section("A deliberately thin profile records nothing as missing");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const assessment = assessReadiness(record, profileB, resultFor(profileB, record));

  check("level is information_needed when eligibility is not decided", assessment.level, "information_needed");
  check("eligibility is unknown, not failed", requirementId(assessment, "eligibility").status, "unknown");
  check("academic floor is unknown, not failed", requirementId(assessment, "academic").status, "unknown");
  check("transcripts are unknown without an academic record", requirementId(assessment, "doc:transcripts").status, "unknown");
  check("cv is unknown without an experience record", requirementId(assessment, "doc:cv").status, "unknown");
  check("percent reflects only the known facts", assessment.percent, 18);
  check("accounted for an empty profile", assessment.accounted, 2);
  check(
    "summary does not claim more than the profile records",
    assessment.summary,
    "Your profile does not yet answer every requirement this award checks.",
  );
}

section("A GPA below the published floor is an eligibility issue");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const assessment = assessReadiness(record, profileC, resultFor(profileC, record));

  check("level is eligibility_issue when a hard requirement fails", assessment.level, "eligibility_issue");
  check("eligibility is not_met", requirementId(assessment, "eligibility").status, "not_met");
  check("academic floor is not_met", requirementId(assessment, "academic").status, "not_met");
  check(
    "summary states the award is not open",
    assessment.summary,
    "This award is not open to your profile as it stands.",
  );
  check("plan leads with fixing eligibility", assessment.plan[0]?.id, "confirm-eligibility");
  check("plan leads with a critical priority", assessment.plan[0]?.priority, "critical");
}

section("A degree below the entry level is an eligibility issue");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const undergraduate = {
    schemaVersion: 1,
    academic: { currentDegree: "bachelors" },
    preferences: { preferredDegree: "bachelors" },
  } as const satisfies StudentProfile;

  const assessment = assessReadiness(record, undergraduate, resultFor(undergraduate, record));
  check("level is eligibility_issue", assessment.level, "eligibility_issue");
  check("eligibility is not_met", requirementId(assessment, "eligibility").status, "not_met");
}

section("A language score below the published minimum surfaces a shortfall");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const lowLanguage = {
    schemaVersion: 1,
    eligibility: { languageTests: { ielts: 5.5 } },
  } as const satisfies StudentProfile;

  const assessment = assessReadiness(record, lowLanguage, resultFor(lowLanguage, record));
  check("language requirement is not_met", requirementId(assessment, "language").status, "not_met");
  check("plan includes a critical meet-language step", assessment.plan.some((step) => step.id === "meet-language" && step.priority === "critical"), true);
}

section("A fully covered application reaches ready");
{
  const record = override(recordById(GLOBAL_EXCELLENCE), {
    documents: [
      { id: "transcripts", label: "Academic Transcripts", requirement: "required" },
      { id: "cv", label: "CV / Resume", requirement: "required" },
      { id: "portfolio", label: "Portfolio", requirement: "optional" },
      { id: "language", label: "English Proficiency Certificate", requirement: "conditional" },
    ],
  });

  const assessment = assessReadiness(record, profileA, resultFor(profileA, record));
  check("level is ready", assessment.level, "ready");
  check("percent is 100", assessment.percent, 100);
  check("attention is zero", assessment.attention, 0);
  check("optional and conditional documents are labelled as such", requirementId(assessment, "doc:portfolio").requirement, "optional");
  check("optional documents stay out of the denominator", assessment.applicable, 7);
  check(
    "summary confirms everything is accounted for",
    assessment.summary,
    "Every known preparation requirement is accounted for.",
  );
  checkPlanOrdered(assessment);
}

section("Many unverified documents push a fully eligible profile into preparation_needed");
{
  const record = override(recordById(GLOBAL_EXCELLENCE), {
    documents: [
      { id: "transcripts", label: "Academic Transcripts", requirement: "required" },
      { id: "degree-certificate", label: "Degree Certificate", requirement: "required" },
      { id: "cv", label: "CV / Resume", requirement: "required" },
      { id: "statement-of-purpose", label: "Statement of Purpose", requirement: "required" },
      { id: "portfolio", label: "Portfolio", requirement: "required" },
      { id: "health", label: "Medical Certificate", requirement: "required" },
      { id: "research-statement", label: "Research Statement", requirement: "required" },
      { id: "graduate-record", label: "Graduate Record", requirement: "required" },
      { id: "letter-1", label: "Reference Letter 1", requirement: "required" },
      { id: "letter-2", label: "Reference Letter 2", requirement: "required" },
    ],
  });

  const assessment = assessReadiness(record, profileA, resultFor(profileA, record));
  check("level is preparation_needed", assessment.level, "preparation_needed");
  check("percent falls below the nearly_ready band", assessment.percent, 53);
  check("unrecognised documents land in the neutral bucket", requirementId(assessment, "doc:health").category, "application");
  check("research statements are categorised", requirementId(assessment, "doc:research-statement").category, "research");
  check("portfolios are categorised", requirementId(assessment, "doc:portfolio").category, "creative");
  checkPlanOrdered(assessment);
}

section("Deadlines");
{
  const record = recordById(GLOBAL_EXCELLENCE);

  const rolling = assessDeadline(override(record, { deadline: null, deadlineKind: "rolling", deadlineNote: "Rolling review" }));
  check("rolling deadline is known", rolling.kind, "rolling");
  check("rolling deadline is not urgent", rolling.urgent, false);
  check("rolling deadline label comes from the provider's wording", rolling.label, "Rolling applications");

  const unknownDeadline = assessDeadline(override(record, { deadline: null, deadlineKind: "unknown" }));
  check("unpublished deadline is reported as unverified", unknownDeadline.kind, "unknown");

  const urgentRecord = override(record, { deadline: "2026-10-12" });
  const urgent = assessDeadline(urgentRecord);
  check("a closing date 6 days away is urgent", urgent.urgent, true);
  check("days remaining match the shared reference date", urgent.daysRemaining, 6);
  const urgentAssessment = assessReadiness(urgentRecord, profileA, resultFor(profileA, urgentRecord));
  check("urgent deadline leads to a critical apply step", urgentAssessment.plan.some((step) => step.id === "meet-deadline" && step.priority === "critical"), true);

  const passed = assessReadiness(override(record, { deadline: "2026-10-01" }), profileA, resultFor(profileA, record));
  check("a passed deadline leads to a critical deadlined step", passed.plan.some((step) => step.id === "meet-deadline" && step.priority === "critical" && step.title === "Deadline passed"), true);
  check("a passed deadline is still reported as known", requirementId(passed, "deadline").status, "satisfied");
}

section("Application guidance");
{
  const record = override(recordById(GLOBAL_EXCELLENCE), {
    howToApply: [],
    officialSource: { ...recordById(GLOBAL_EXCELLENCE).officialSource, applicationUrl: undefined },
  });

  const assessment = assessReadiness(record, profileA, resultFor(profileA, record));
  check("missing application guidance is unknown", requirementId(assessment, "application-guidance").status, "unknown");
  check(
    "plan points at confirming how to apply",
    assessment.plan.some((step) => step.id === "submit-application" && step.title === "Confirm how to apply"),
    true,
  );
}

section("Category mapping");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const assessment = assessReadiness(record, profileA, resultFor(profileA, record));
  const category = (id: string) => requirementId(assessment, id).category;

  check("passport maps to identity", category("doc:passport"), "identity");
  check("transcripts map to academic", category("doc:transcripts"), "academic");
  check("cv maps to experience", category("doc:cv"), "experience");
  check("statement maps to writing", category("doc:sop"), "writing");
  check("references map to recommendations", category("doc:references"), "recommendations");
  check("language certificate maps to language", category("doc:language"), "language");
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);