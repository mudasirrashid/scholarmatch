/**
 * Deadline reading for a tracked application.
 *
 * Counts whole days exactly like the explorer (shared reference date and the
 * same format helpers), then classifies how the student should read it given
 * where their application sits:
 *
 *   - `upcoming`  more than 21 days away;
 *   - `due_soon`  1-21 days away;
 *   - `today`     the closing date is the reference date;
 *   - `overdue`   the date has passed and there is still something to do
 *                 (the application is not submitted yet);
 *   - `closed`    the date has passed and the application has been submitted,
 *                 so there is no remaining action on this award;
 *   - `rolling`   the provider reviews as applications arrive;
 *   - `varies`    the provider publishes no single date and says why;
 *   - `unknown`   no closing date is published.
 *
 * A label uses a real date or the provider's own wording — a card never
 * invents a countdown the provider did not commit to. `urgent` means the
 * deadline is actionable pressure: overdue before submission, today, or due
 * soon. A passed deadline on a submitted application is not urgent, because
 * there is nothing left to do.
 */

import { formatDeadline, formatExactDate, formatOpenDeadline } from "@/lib/format";
import { daysUntil } from "@/lib/scholarships/preview";

import type { ApplicationStatus, TrackedApplication } from "@/types/application";
import type { Scholarship } from "@/types/scholarship";

export type DeadlineState =
  | "upcoming"
  | "due_soon"
  | "today"
  | "overdue"
  | "closed"
  | "rolling"
  | "varies"
  | "unknown";

export interface DeadlineRead {
  state: DeadlineState;
  /** True when the deadline demands action now. */
  urgent: boolean;
  /** A short human label, e.g. "8 days left (14 Oct 2026)". */
  label: string;
  /** The provider's own deadline note, when there is one. */
  note: string | null;
}

const SUBMITTED: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  "applied",
  "under_review",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
]);

export function deadlineReport(scholarship: Scholarship, status: ApplicationStatus): DeadlineRead {
  const note = scholarship.deadlineNote ?? null;

  if (scholarship.deadline !== null) {
    const days = daysUntil(scholarship.deadline);
    if (days !== null) {
      if (days > 21) {
        return { state: "upcoming", urgent: false, label: `${formatDeadline(days)} (${formatExactDate(scholarship.deadline)})`, note };
      }
      if (days > 0) {
        return { state: "due_soon", urgent: true, label: `${formatDeadline(days)} (${formatExactDate(scholarship.deadline)})`, note };
      }
      if (days === 0) {
        return { state: "today", urgent: true, label: `Deadline today (${formatExactDate(scholarship.deadline)})`, note };
      }

      const passed = -days;
      if (SUBMITTED.has(status)) {
        return { state: "closed", urgent: false, label: `Closed ${formatExactDate(scholarship.deadline)}`, note };
      }
      return {
        state: "overdue",
        urgent: true,
        label: `Deadline passed ${passed} day${passed === 1 ? "" : "s"} ago (${formatExactDate(scholarship.deadline)})`,
        note,
      };
    }
  }

  switch (scholarship.deadlineKind) {
    case "rolling":
      return { state: "rolling", urgent: false, label: formatOpenDeadline("rolling"), note };
    case "varies":
      return { state: "varies", urgent: false, label: formatOpenDeadline("varies"), note };
    default:
      return { state: "unknown", urgent: false, label: formatOpenDeadline("unknown"), note };
  }
}

/**
 * Convenience over the stored record: reads the status off `trackedAt`'s
 * sibling record. Handy for surfaces holding a `TrackedApplication`.
 */
export function deadlineForTracked(scholarship: Scholarship, tracked: TrackedApplication): DeadlineRead {
  return deadlineReport(scholarship, tracked.status);
}