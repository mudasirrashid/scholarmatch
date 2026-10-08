/**
 * Attention ordering for tracked applications.
 *
 * The dashboard is more useful when urgent work floats to the top than when it
 * mirrors tracker order, so every tracked row is given a single rank — lower
 * is more urgent — combining the deadline's pressure with whether preparation
 * is still incomplete:
 *
 *   0  overdue  (pre-submission, deadline passed)
 *   1  today    (deadline is the reference date)
 *   2  due_soon (1-21 days)
 *   3  preparing with an incomplete checklist
 *   4  preparing / ready_to_apply with no deadline pressure
 *   5  awaiting a decision (applied, under review, interview)
 *   6  terminal (accepted, rejected, withdrawn)
 *
 * `needsAttention` is the surface-facing concept: ranks 0-3. Everything that
 * does not need attention today still has a rank so ordering stays stable.
 */

import type { DeadlineRead } from "@/lib/applications/deadline";
import type { NextAction } from "@/lib/applications/next-action";
import type { PreparationProgress } from "@/lib/applications/progress";
import type { ApplicationStatus, TrackedApplication } from "@/types/application";
import type { Scholarship } from "@/types/scholarship";

export type ApplicationAttentionRank = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A tracked row plus everything derived from it, ready to render or sort. */
export interface TrackedRow {
  tracked: TrackedApplication;
  /** Undefined when the tracked id no longer exists in the collection. */
  scholarship?: Scholarship;
  deadline: DeadlineRead;
  progress: PreparationProgress;
  nextAction?: NextAction;
  rank: ApplicationAttentionRank;
  /** True when the row needs attention (rank <= 3). */
  needsAttention: boolean;
}

export function attentionRank(
  status: ApplicationStatus,
  deadline: DeadlineRead,
  progress: PreparationProgress,
): ApplicationAttentionRank {
  switch (status) {
    case "applied":
    case "under_review":
    case "interview":
      return 5;
    case "accepted":
    case "rejected":
    case "withdrawn":
      return 6;
    default:
      break;
  }

  switch (deadline.state) {
    case "overdue":
      return 0;
    case "today":
      return 1;
    case "due_soon":
      return 2;
    default:
      break;
  }

  if (status === "preparing" && progress.marked < progress.total) return 3;
  return 4;
}

export function needsAttention(rank: ApplicationAttentionRank): boolean {
  return rank <= 3;
}

/**
 * Orders rows by rank ascending, then by most recently updated first, so
 * attention work leads and recent activity breaks ties within a rank.
 */
export function sortTracked(rows: readonly TrackedRow[]): TrackedRow[] {
  return [...rows].sort(
    (a, b) => a.rank - b.rank || b.tracked.updatedAt.localeCompare(a.tracked.updatedAt),
  );
}