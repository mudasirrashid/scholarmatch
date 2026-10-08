/**
 * Preparation progress behind a tracked application.
 *
 * A tracking card shows how much of the award's preparation checklist is
 * marked in this browser. It reuses the Phase 06 tracker wholesale rather than
 * re-deriving rows: `trackableItems` supplies what to count and `marksFor`
 * supplies what is ticked, so the dashboard and the detail-page tracker can
 * never disagree about what a mark means.
 *
 * The figure is a record of the visitor's own ticks, not the readiness score:
 * readiness is a fact about the profile and the provider's requirements, a
 * marked checklist is a claim the visitor makes. Only the latter appears here.
 */

import { marksFor, trackableItems } from "@/lib/preparation/tracker";

import type { ChecklistRecords } from "@/lib/preparation/tracker";
import type { Scholarship } from "@/types/scholarship";

export interface PreparationProgress {
  /** Marked rows in this browser. */
  marked: number;
  /** Trackable rows for this award. */
  total: number;
  /** Whole-number percentage, 0-100. */
  percent: number;
}

const COMPLETE: PreparationProgress = { marked: 0, total: 0, percent: 100 };

export function preparationProgress(
  scholarship: Scholarship,
  checklist: ChecklistRecords,
): PreparationProgress {
  const items = trackableItems(scholarship);
  if (items.length === 0) return COMPLETE;

  const marks = marksFor(checklist, scholarship.id);
  const marked = items.reduce((count, item) => (marks.has(item.id) ? count + 1 : count), 0);

  return {
    marked,
    total: items.length,
    percent: Math.round((marked / items.length) * 100),
  };
}

/** Callers hold no scholarship at all (a stale tracked id): nothing to count. */
export const NO_SCHOLARSHIP_PROGRESS: PreparationProgress = COMPLETE;