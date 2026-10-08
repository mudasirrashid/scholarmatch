/**
 * Application tracking.
 *
 * Phase 07 vocabulary. A tracked application is a decision a visitor makes
 * about one scholarship — where in the application journey it sits right now —
 * persisted to this browser's `localStorage` exactly like bookmarks
 * (`scholarmatch:saved`), the profile (`scholarmatch:profile`) and the
 * preparation checklist (`scholarmatch:checklist`).
 *
 * These shapes are deliberately independent of the match and readiness models.
 * A match score says how well the visitor's profile fits, readiness says what
 * still needs preparing, and a tracked application records progress through the
 * application itself. One never derives from another: changing a status must
 * not move a match score, and ticking a preparation row must not change a
 * status.
 */

/**
 * Where a tracked application sits in the journey, in display order.
 *
 * Transitions are deliberately unrestricted (any status can be reached from any
 * other): students correct mistakes and change their minds, so a plain select
 * is the honest control rather than a constrained state machine.
 */
export type ApplicationStatus =
  | "interested"
  | "preparing"
  | "ready_to_apply"
  | "applied"
  | "under_review"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

/** Human-readable label for every status. */
export const APPLICATION_STATUS_LABEL: Readonly<Record<ApplicationStatus, string>> = {
  interested: "Interested",
  preparing: "Preparing",
  ready_to_apply: "Ready to apply",
  applied: "Applied",
  under_review: "Under review",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** Statuses in the order a student moves through them. */
export const APPLICATION_STATUS_ORDER: readonly ApplicationStatus[] = [
  "interested",
  "preparing",
  "ready_to_apply",
  "applied",
  "under_review",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
];

/**
 * One tracked application, exactly as stored per scholarship.
 *
 * `trackedAt` is when tracking began and never changes; `updatedAt` moves with
 * every status or note change and drives the dashboard's ordering tiebreak.
 * Both are ISO timestamps written by the store (never by a test or a clock the
 * server cannot reproduce), which is what keeps the pure functions deterministic.
 */
export interface TrackedApplication {
  scholarshipId: string;
  status: ApplicationStatus;
  /** ISO datetime when tracking began. */
  trackedAt: string;
  /** ISO datetime of the last status or note change. */
  updatedAt: string;
  /** Optional private note, stored in this browser only. */
  note?: string;
}

/** Statuses that mean the application has been submitted. */
export const SUBMITTED_STATUSES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  "applied",
  "under_review",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
]);

/** Statuses where the award is done with the student: nothing more to do. */
export const TERMINAL_STATUSES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  "accepted",
  "rejected",
  "withdrawn",
]);