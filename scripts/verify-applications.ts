/**
 * Application tracking verification.
 *
 * Phase 07 derives a deadline reading, the one next step worth taking, a
 * preparation-progress figure and an attention rank from a status, a record
 * and the visitor's own checklist marks. This script asserts that those
 * derivations stay deterministic, honest and within bounds:
 *
 *   - the stored record is read tolerantly (malformed storage never breaks a
 *     page) and written back losslessly;
 *   - tracking is idempotent, so a second tap cannot reset progress;
 *   - a deadline is never invented: each state is backed by a real date or the
 *     provider's own wording;
 *   - the next step depends only on status, deadline and preparation, and an
 *     official-application step links out only when a verified submission URL
 *     exists;
 *   - attention ordering is stable and needs-attention only for urgent work.
 */

import {
  APPLICATIONS_SCHEMA_VERSION,
  APPLICATIONS_STORAGE_KEY,
  NO_SCHOLARSHIP_PROGRESS,
  applicationByScholarship,
  attentionRank,
  deadlineReport,
  needsAttention,
  nextAction,
  parseApplications,
  preparationProgress,
  serializeApplications,
  setApplicationNote,
  setApplicationStatus,
  sortTracked,
  trackApplication,
  untrackApplication,
} from "@/lib/applications";
import { CHECKLIST_SCHEMA_VERSION, trackableItems } from "@/lib/preparation/tracker";
import { scholarships } from "@/lib/demo/data";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_ORDER,
  SUBMITTED_STATUSES,
  TERMINAL_STATUSES,
} from "@/types/application";

import type { ApplicationRecords } from "@/lib/applications";
import type { ChecklistRecords } from "@/lib/preparation/tracker";
import type { ApplicationStatus } from "@/types/application";
import type { Scholarship } from "@/types/scholarship";

const GLOBAL_EXCELLENCE = "demo-global-excellence";
const NOW = "2026-10-07T09:00:00.000Z";
const LATER = "2026-10-08T09:00:00.000Z";
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

function emptyRecords(): ApplicationRecords {
  return parseApplications(null);
}

/** A checklist whose marks mirror the record's own trackable rows. */
function checklistWithMarks(scholarship: Scholarship, markedCount: number): ChecklistRecords {
  const ids = trackableItems(scholarship)
    .map((item) => item.id)
    .slice(0, markedCount);
  return {
    version: CHECKLIST_SCHEMA_VERSION,
    records: { [scholarship.id]: ids },
  };
}

function progressFor(scholarship: Scholarship, markedCount: number) {
  return preparationProgress(scholarship, checklistWithMarks(scholarship, markedCount));
}

function actionFor(scholarship: Scholarship, status: ApplicationStatus, markedCount: number) {
  const deadline = deadlineReport(scholarship, status);
  return nextAction({
    scholarship,
    status,
    deadline,
    progress: progressFor(scholarship, markedCount),
  });
}

section("Status vocabulary");
{
  check("every status has a label", APPLICATION_STATUS_ORDER.every((status) => APPLICATION_STATUS_LABEL[status].length > 0), true);
  check("status order covers every accepted status", APPLICATION_STATUS_ORDER.length, 9);
  check("submitted set matches the applied-half statuses", Array.from(SUBMITTED_STATUSES).sort(), ["accepted", "applied", "interview", "rejected", "under_review", "withdrawn"].sort());
  check("terminal set matches the finished statuses", Array.from(TERMINAL_STATUSES).sort(), ["accepted", "rejected", "withdrawn"].sort());
  check("no status is simultaneously pending and terminal", APPLICATION_STATUS_ORDER.every((status) => !(TERMINAL_STATUSES.has(status) && (status === "interested" || status === "preparing" || status === "ready_to_apply"))), true);
  check("a demo record carries no verified submission URL", recordById(GLOBAL_EXCELLENCE).officialSource.applicationUrl, undefined);
}

section("Deadline states");
{
  const record = override(recordById(GLOBAL_EXCELLENCE), { deadline: "2026-12-31" });
  const upcoming = deadlineReport(record, "interested");
  check("an exact date more than 21 days away is upcoming", upcoming.state, "upcoming");
  check("upcoming is not urgent", upcoming.urgent, false);
  check("upcoming label uses the format helpers", upcoming.label, "3 months left (31 Dec 2026)");

  const dueSoon = deadlineReport(override(record, { deadline: "2026-10-14" }), "preparing");
  check("an exact date 1-21 days away is due_soon", dueSoon.state, "due_soon");
  check("due_soon is urgent", dueSoon.urgent, true);
  check("due_soon label carries the real date", dueSoon.label, "8 days left (14 Oct 2026)");

  const today = deadlineReport(override(record, { deadline: "2026-10-06" }), "ready_to_apply");
  check("the reference-date closing date is today", today.state, "today");
  check("today is urgent", today.urgent, true);
  check("today label names the date", today.label, "Deadline today (6 Oct 2026)");

  const overdue = deadlineReport(override(record, { deadline: "2026-10-01" }), "preparing");
  check("a passed date before submission is overdue", overdue.state, "overdue");
  check("overdue is urgent", overdue.urgent, true);
  check("overdue label counts the days passed", overdue.label, "Deadline passed 5 days ago (1 Oct 2026)");

  const closed = deadlineReport(override(record, { deadline: "2026-10-01" }), "applied");
  check("a passed date after submission is closed", closed.state, "closed");
  check("closed is not urgent", closed.urgent, false);
  check("closed label keeps the real date", closed.label, "Closed 1 Oct 2026");

  const rolling = deadlineReport(override(record, { deadline: null, deadlineKind: "rolling", deadlineNote: "Rolling review" }), "preparing");
  check("a rolling deadline is its own state", rolling.state, "rolling");
  check("rolling is not urgent and uses the provider's wording", [rolling.urgent, rolling.label], [false, "Rolling applications"]);

  const varies = deadlineReport(override(record, { deadline: null, deadlineKind: "varies" }), "preparing");
  check("varying dates are labelled as such", [varies.state, varies.label], ["varies", "Dates vary"]);

  const unknown = deadlineReport(override(record, { deadline: null }), "preparing");
  check("an unpublished deadline is unknown", [unknown.state, unknown.label], ["unknown", "Deadline not announced"]);

  const withNote = deadlineReport(override(record, { deadline: "2026-10-14", deadlineNote: "Closes 16:00 local time" }), "preparing");
  check("a provider deadline note travels on the reading", withNote.note, "Closes 16:00 local time");
}

section("Preparation progress");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const total = trackableItems(record).length;

  check("no marks means zero progress", progressFor(record, 0), { marked: 0, total, percent: 0 });
  check("half the marks lands near 50 percent", progressFor(record, Math.floor(total / 2)), {
    marked: Math.floor(total / 2),
    total,
    percent: Math.round((Math.floor(total / 2) / total) * 100),
  });
  check("all marks means complete", progressFor(record, total), { marked: total, total, percent: 100 });
  check("marks on another award count for nothing", preparationProgress(record, checklistWithMarks(override(record, { id: "demo-other" }), 999)), { marked: 0, total, percent: 0 });
  check("a missing scholarship reports no progress", NO_SCHOLARSHIP_PROGRESS, { marked: 0, total: 0, percent: 100 });
}

section("Next action");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const withPortal = override(record, { officialSource: { ...record.officialSource, applicationUrl: "https://portal.example.org/apply" } });
  const total = trackableItems(record).length;

  const interestedSoon = actionFor(override(record, { deadline: "2026-10-14" }), "interested", 0);
  check("interested with a close deadline starts preparing now, cautiously", [interestedSoon.id, interestedSoon.tone, interestedSoon.href], ["start-preparation-urgent", "caution", `/scholarships/${GLOBAL_EXCELLENCE}#prepare`]);

  const interestedCalm = actionFor(override(record, { deadline: "2026-12-31" }), "interested", 0);
  check("interested without pressure starts preparing plainly", [interestedCalm.id, interestedCalm.tone], ["start-preparation", "neutral"]);

  const preparingOverdue = actionFor(override(record, { deadline: "2026-10-01" }), "preparing", 0);
  check("preparing after the deadline asks to confirm it", [preparingOverdue.id, preparingOverdue.tone], ["confirm-deadline", "caution"]);

  const preparingIncomplete = actionFor(record, "preparing", Math.floor(total / 2));
  check("preparing with marks outstanding continues the checklist", [preparingIncomplete.id, preparingIncomplete.tone], ["continue-preparation", "neutral"]);
  check("continue-preparation counts the real marks", preparingIncomplete.detail.includes(`of ${total} preparation steps`), true);

  const preparingComplete = actionFor(record, "preparing", total);
  check("preparing, complete and calm starts the official application", [preparingComplete.id, preparingComplete.tone], ["start-official-application", "accent"]);
  check("preparing without a portal points back at the detail page", preparingComplete.href, `/scholarships/${GLOBAL_EXCELLENCE}`);
  const portalReady = actionFor(withPortal, "ready_to_apply", total);
  check("an official-application step links out only when a portal exists", portalReady.href, "https://portal.example.org/apply");

  const readyToday = actionFor(override(record, { deadline: "2026-10-06" }), "ready_to_apply", total);
  check("ready to apply on the day submits today, cautiously", [readyToday.id, readyToday.tone], ["submit-today", "caution"]);

  const readySoon = actionFor(override(record, { deadline: "2026-10-14" }), "ready_to_apply", total);
  check("ready to apply with days left submits before the deadline", readySoon.id, "submit-before-deadline");

  const awaiting = actionFor(record, "applied", total);
  check("applied waits for the review", awaiting.id, "wait-for-review");
  check("under review monitors the status", actionFor(record, "under_review", total).id, "monitor-status");
  check("interview prepares for the interview", actionFor(record, "interview", total).id, "prepare-interview");

  const accepted = actionFor(record, "accepted", total);
  check("accepted reviews next steps as a terminal action", [accepted.id, accepted.tone, accepted.terminal], ["review-next-steps", "positive", true]);

  const rejected = actionFor(record, "rejected", total);
  check("rejected points back at matches", [rejected.id, rejected.href], ["explore-others", "/matches"]);
  check("withdrawn leads to other matches", actionFor(record, "withdrawn", total).href, "/matches");

  check("an overdue ready_to_apply confirms the deadline rather than submitting", actionFor(override(record, { deadline: "2026-10-01" }), "ready_to_apply", total).id, "confirm-deadline");

  const one = actionFor(record, "preparing", total);
  check("the next action is deterministic", JSON.stringify(one), JSON.stringify(actionFor(record, "preparing", total)));
  check("deadline readings drive next actions with no clock involved", actionFor(override(record, { deadline: "2026-10-14" }), "ready_to_apply", total).id, actionFor(override(record, { deadline: "2026-10-20" }), "ready_to_apply", total).id);
}

section("Attention ordering");
{
  const record = recordById(GLOBAL_EXCELLENCE);
  const rankFor = (status: ApplicationStatus, deadline: string | null, deadlineKind: Scholarship["deadlineKind"], markedCount: number) => {
    const fixture = override(record, deadline === null ? { deadline: null, deadlineKind } : { deadline });
    return attentionRank(status, deadlineReport(fixture, status), progressFor(record, markedCount));
  };

  check("overdue ranks 0", rankFor("preparing", "2026-10-01", undefined, 0), 0);
  check("today ranks 1", rankFor("interested", "2026-10-06", undefined, 0), 1);
  check("due soon ranks 2", rankFor("ready_to_apply", "2026-10-14", undefined, 0), 2);
  check("preparing with marks outstanding ranks 3", rankFor("preparing", "2026-12-31", undefined, Math.floor(trackableItems(record).length / 2)), 3);
  check("preparing, complete and calm ranks 4", rankFor("preparing", "2026-12-31", undefined, trackableItems(record).length), 4);
  check("calm interested ranks 4", rankFor("interested", "2026-12-31", undefined, 0), 4);
  check("awaiting a decision ranks 5", rankFor("under_review", "2026-12-31", undefined, 0), 5);
  check("a terminal result ranks 6", rankFor("accepted", "2026-12-31", undefined, 0), 6);
  check("a passed deadline on a submitted application does not rank urgent", rankFor("applied", "2026-10-01", undefined, 0), 5);

  check("needs attention includes rank 3", needsAttention(3), true);
  check("needs attention excludes rank 4", needsAttention(4), false);

  const base = recordById(GLOBAL_EXCELLENCE);
  const row = (status: ApplicationStatus, updatedAt: string) => {
    const deadline = deadlineReport(base, status);
    const progress = progressFor(base, 0);
    return {
      tracked: { scholarshipId: base.id, status, trackedAt: NOW, updatedAt },
      scholarship: base,
      deadline,
      progress,
      rank: attentionRank(status, deadline, progress),
      needsAttention: needsAttention(attentionRank(status, deadline, progress)),
    };
  };

  const ordered = sortTracked([
    row("accepted", LATER),
    row("preparing", LATER),
    row("ready_to_apply", NOW),
    row("ready_to_apply", LATER),
  ]);
  check("attention ordering puts urgent work first", ordered.map((entry) => entry.tracked.status), ["preparing", "ready_to_apply", "ready_to_apply", "accepted"]);
  check("the newest update wins the tiebreak within a rank", [ordered[1].tracked.updatedAt, ordered[2].tracked.updatedAt], [LATER, NOW]);
  const staleRank = attentionRank("preparing", { state: "unknown", urgent: false, label: "No longer listed", note: null }, NO_SCHOLARSHIP_PROGRESS);
  check("a stale record without a scholarship ranks calmly", staleRank, 4);
}

section("Storage");
{
  check("an absent key parses to empty records", parseApplications(null), { version: APPLICATIONS_SCHEMA_VERSION, records: {} });
  check("malformed JSON parses to empty records", parseApplications("{ nope"), { version: APPLICATIONS_SCHEMA_VERSION, records: {} });
  check("a non-object parses to empty records", parseApplications("[]"), { version: APPLICATIONS_SCHEMA_VERSION, records: {} });
  check("missing records parses to empty records", parseApplications('{"version":1}'), { version: APPLICATIONS_SCHEMA_VERSION, records: {} });
  check("a non-object records map parses to empty", parseApplications('{"records":"x"}'), { version: APPLICATIONS_SCHEMA_VERSION, records: {} });

  const valid = JSON.stringify({
    version: APPLICATIONS_SCHEMA_VERSION,
    records: {
      [GLOBAL_EXCELLENCE]: { scholarshipId: GLOBAL_EXCELLENCE, status: "preparing", trackedAt: NOW, updatedAt: LATER, note: "Ask about the language waiver" },
    },
  });
  check("a valid record parses with its note", parseApplications(valid).records[GLOBAL_EXCELLENCE]?.note, "Ask about the language waiver");

  const mixed = JSON.stringify({
    version: APPLICATIONS_SCHEMA_VERSION,
    records: {
      ok: { scholarshipId: "ok", status: "applied", trackedAt: NOW, updatedAt: LATER },
      badStatus: { scholarshipId: "badStatus", status: "ghosted", trackedAt: NOW, updatedAt: LATER },
      missingStamp: { scholarshipId: "missingStamp", status: "interested", trackedAt: NOW },
      wrongKey: { scholarshipId: "different", status: "interested", trackedAt: NOW, updatedAt: LATER },
      badNote: { scholarshipId: "badNote", status: "interested", trackedAt: NOW, updatedAt: LATER, note: 5 },
      truncated: "nope",
    },
  });
  const parsed = parseApplications(mixed).records;
  check("unknown statuses are skipped", parsed.badStatus, undefined);
  check("records without updatedAt are skipped", parsed.missingStamp, undefined);
  check("records whose key mismatches their id are skipped", parsed.wrongKey, undefined);
  check("non-string notes are skipped", parsed.badNote, undefined);
  check("non-object values are skipped", parsed.truncated, undefined);
  check("valid records survive the mixed parse", parsed.ok?.status, "applied");
  check("the stores round-trip losslessly", parseApplications(serializeApplications(parseApplications(valid))), parseApplications(valid));
  check("the key is namespaced like the other stores", APPLICATIONS_STORAGE_KEY, "scholarmatch:applications");
}

section("Mutations");
{
  const tracked = trackApplication(emptyRecords(), GLOBAL_EXCELLENCE, NOW);
  check("tracking creates an interested record at the given time", tracked.records[GLOBAL_EXCELLENCE], { scholarshipId: GLOBAL_EXCELLENCE, status: "interested", trackedAt: NOW, updatedAt: NOW });

  const trackedTwice = trackApplication(tracked, GLOBAL_EXCELLENCE, LATER);
  check("tracking is idempotent and never resets progress", trackedTwice.records[GLOBAL_EXCELLENCE], tracked.records[GLOBAL_EXCELLENCE]);

  trackApplication(emptyRecords(), "demo-other", NOW);
  const second = trackApplication(tracked, "demo-other", NOW);
  check("tracking preserves other records", second.records[GLOBAL_EXCELLENCE]?.status, "interested");
  check("tracking another award adds a second record", Object.keys(second.records).sort(), [GLOBAL_EXCELLENCE, "demo-other"].sort());

  const moved = setApplicationStatus(tracked, GLOBAL_EXCELLENCE, "applied", LATER);
  check("a status change updates status and updatedAt", [moved.records[GLOBAL_EXCELLENCE]?.status, moved.records[GLOBAL_EXCELLENCE]?.updatedAt], ["applied", LATER]);
  check("changing to the same status is a no-op", setApplicationStatus(moved, GLOBAL_EXCELLENCE, "applied", LATER), moved);
  check("changing a missing record is a no-op", setApplicationStatus(emptyRecords(), "nope", "applied", LATER), emptyRecords());

  const noted = setApplicationNote(moved, GLOBAL_EXCELLENCE, "Reply to the reference request", LATER);
  check("a note is stored with the record", noted.records[GLOBAL_EXCELLENCE]?.note, "Reply to the reference request");
  check("a note change bumps updatedAt", noted.records[GLOBAL_EXCELLENCE]?.updatedAt, LATER);
  const cleared = setApplicationNote(noted, GLOBAL_EXCELLENCE, "", LATER);
  check("an empty note removes the field", cleared.records[GLOBAL_EXCELLENCE]?.note, undefined);
  check("setting the same note is a no-op", setApplicationNote(noted, GLOBAL_EXCELLENCE, "Reply to the reference request", NOW), noted);
  check("noting a missing record is a no-op", setApplicationNote(emptyRecords(), "nope", "x", NOW), emptyRecords());

  const removed = untrackApplication(noted, GLOBAL_EXCELLENCE);
  check("untracking removes the record and its note", applicationByScholarship(removed, GLOBAL_EXCELLENCE), undefined);
  check("untracking a missing record is a no-op", untrackApplication(removed, "nope"), removed);
  check("untracking preserves sibling records", applicationByScholarship(trackApplication(removed, "demo-other", NOW), "demo-other")?.status, "interested");

  check("mutations compose into a valid serialisable store", serializeApplications(removed).length > 0, true);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);