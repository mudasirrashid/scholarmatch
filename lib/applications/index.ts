/**
 * Application tracking surface helpers.
 *
 * Pure and deterministic, like the checklist store they sit beside: the same
 * record, status, deadline and preparation marks always produce the same
 * deadline reading, next step, progress figure and attention rank. Nothing in
 * here reads `localStorage` or touches a clock — the store functions take an
 * injected `now`, and the browser-facing hook in `components/applications`
 * owns the actual store subscription.
 */

export {
  APPLICATIONS_SCHEMA_VERSION,
  APPLICATIONS_STORAGE_KEY,
  applicationByScholarship,
  parseApplications,
  serializeApplications,
  setApplicationNote,
  setApplicationStatus,
  trackApplication,
  untrackApplication,
} from "@/lib/applications/store";

export { deadlineForTracked, deadlineReport } from "@/lib/applications/deadline";
export { nextAction } from "@/lib/applications/next-action";
export { NO_SCHOLARSHIP_PROGRESS, preparationProgress } from "@/lib/applications/progress";
export { attentionRank, needsAttention, sortTracked } from "@/lib/applications/priority";

export type { DeadlineRead, DeadlineState } from "@/lib/applications/deadline";
export type { NextAction, NextActionTone } from "@/lib/applications/next-action";
export type { PreparationProgress } from "@/lib/applications/progress";
export type { ApplicationAttentionRank, TrackedRow } from "@/lib/applications/priority";
export type { ApplicationRecords } from "@/lib/applications/store";