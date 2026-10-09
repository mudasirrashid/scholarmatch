/**
 * Assembling what the companion is allowed to know.
 *
 * One pure builder, fed by the browser-local stores the rest of the product
 * already reads, plus the entry point's URL. It reads; it never decides.
 *
 * ## Focus
 *
 * Most useful questions need an award in front of them ("what am I missing?",
 * "explain this scholarship"). The focus is:
 *
 * 1. the scholarship named by the entry point, when there is one;
 * 2. otherwise the visitor's current top match, but only when their profile has
 *    something to say — an empty profile has no top match worth quoting.
 *
 * An implicit focus is always labelled as such by the responder, so a student
 * is never told about an award they did not choose as though they had chosen
 * it.
 *
 * ## Tracked rows
 *
 * Rows are composed from the public helpers in `lib/applications`
 * (`deadlineReport`, `preparationProgress`, `attentionRank`, `nextAction`) and
 * ordered by `sortTracked`, exactly as the dashboard composes them. No deadline
 * arithmetic, ranking rule or status logic lives here.
 */

import {
  attentionRank,
  deadlineReport,
  needsAttention,
  nextAction,
  NO_SCHOLARSHIP_PROGRESS,
  preparationProgress,
  sortTracked,
} from "@/lib/applications";
import { assessReadiness } from "@/lib/preparation";
import { matchScholarship, rankScholarships } from "@/lib/matching";
import { profileCompletion } from "@/lib/profile/completion";
import { allScholarships, getScholarship } from "@/lib/scholarships";

import type {
  AssistantContext,
  AssistantFocus,
  AssistantMode,
} from "@/lib/assistant/types";
import type { ApplicationRecords, DeadlineRead, TrackedRow } from "@/lib/applications";
import type { ChecklistRecords } from "@/lib/preparation/tracker";
import type { StudentProfile } from "@/types/student";

/** What the entry point URL said before any store was read. */
export interface AssistantEntry {
  mode: AssistantMode;
  /** Scholarship id carried in `?scholarship=`, already validated by lookup. */
  scholarshipId: string | null;
}

/**
 * Maps an entry point to a mode.
 *
 * `?from=` is the page the student came from; `?scholarship=` names an award.
 * An unknown `from` value is treated as "no preference" rather than being
 * trusted, so a hand-edited URL cannot claim a context that does not exist.
 */
export function modeFrom(from: string | null, hasScholarship: boolean): AssistantMode {
  switch (from) {
    case "profile":
      return "profile";
    case "matches":
      return "match";
    case "applications":
      return "application";
    case "preparation":
      return "preparation";
    case "scholarship":
      return "scholarship";
    default:
      return hasScholarship ? "scholarship" : "general";
  }
}

/**
 * Composes every tracked application, most urgent first.
 *
 * A stale id — a scholarship that has left the collection — keeps its record so
 * the student's own status is never silently dropped, and simply carries no
 * scholarship, no deadline reading and no next action, exactly as the
 * dashboard treats it.
 */
function trackedRows(
  records: ApplicationRecords,
  checklist: ChecklistRecords,
): TrackedRow[] {
  const rows = Object.values(records.records).map((tracked): TrackedRow => {
    const scholarship = getScholarship(tracked.scholarshipId);

    if (!scholarship) {
      // Same reading the dashboard gives a stale id: no award, so no deadline
      // to report, and the record itself is left untouched.
      const deadline: DeadlineRead = {
        state: "unknown",
        urgent: false,
        label: "No longer listed",
        note: null,
      };
      const rank = attentionRank(tracked.status, deadline, NO_SCHOLARSHIP_PROGRESS);
      return {
        tracked,
        deadline,
        progress: NO_SCHOLARSHIP_PROGRESS,
        rank,
        needsAttention: needsAttention(rank),
      };
    }

    const deadline = deadlineReport(scholarship, tracked.status);
    const progress = preparationProgress(scholarship, checklist);
    const rank = attentionRank(tracked.status, deadline, progress);

    return {
      tracked,
      scholarship,
      deadline,
      progress,
      rank,
      needsAttention: needsAttention(rank),
      nextAction: nextAction({ scholarship, status: tracked.status, deadline, progress }),
    };
  });

  return sortTracked(rows);
}

export function buildAssistantContext(input: {
  entry: AssistantEntry;
  profile: StudentProfile;
  applications: ApplicationRecords;
  checklist: ChecklistRecords;
}): AssistantContext {
  const { entry, profile, applications, checklist } = input;

  const scholarship = entry.scholarshipId
    ? (getScholarship(entry.scholarshipId) ?? null)
    : null;

  const match = scholarship ? matchScholarship(profile, scholarship) : null;
  const readiness = scholarship && match ? assessReadiness(scholarship, profile, match) : null;

  const rows = trackedRows(applications, checklist);
  const tracked = scholarship
    ? (rows.find((row) => row.tracked.scholarshipId === scholarship.id) ?? null)
    : null;

  return {
    mode: entry.mode,
    profile,
    completion: profileCompletion(profile),
    scholarship,
    match,
    readiness,
    tracked,
    rows,
  };
}

/**
 * The award an answer should be about, or `null` when there is nothing honest
 * to answer with.
 *
 * The implicit branch recomputes the ranking rather than caching it: it is the
 * same pure call `/matches` makes, the collection is small, and a cache would
 * outlive the profile change that invalidates it.
 */
export function focusOf(context: AssistantContext): AssistantFocus | null {
  if (context.scholarship && context.match && context.readiness) {
    return {
      scholarship: context.scholarship,
      match: context.match,
      readiness: context.readiness,
      tracked: context.tracked,
      isExplicit: true,
    };
  }

  // Nothing answered yet: there is no top match to quote, and inventing one
  // would present a damped figure as though it meant something.
  if (context.completion.answeredCount === 0) return null;

  const top = rankScholarships(context.profile, allScholarships())[0];
  if (!top) return null;

  return {
    scholarship: top.scholarship,
    match: top.match,
    readiness: assessReadiness(top.scholarship, context.profile, top.match),
    tracked: context.rows.find((row) => row.tracked.scholarshipId === top.scholarship.id) ?? null,
    isExplicit: false,
  };
}
