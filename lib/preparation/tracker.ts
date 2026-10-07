/**
 * In-browser preparation checklist.
 *
 * The readiness figure in `lib/preparation/index.ts` is computed from the
 * profile and the provider's published requirements. This module is the other
 * half: a visitor's own to-do list on top of those requirements, persisted to
 * `localStorage` exactly like bookmarks (`scholarmatch:saved`) and the profile
 * (`scholarmatch:profile`).
 *
 * The two are kept apart deliberately. A mark is a claim the visitor makes
 * about their own preparation, not something the profile has evidenced, so it
 * is never folded into the figure or the action plan. Ticking a box changes
 * only what this browser records, and the copy around the tracker says so.
 *
 * Everything here is pure and testable; the store boundaries are read and
 * write functions.
 */

import { categoryFor, PREPARATION_CATEGORY_LABEL } from "@/lib/preparation";

import type { PreparationCategory } from "@/lib/preparation";
import type { Scholarship } from "@/types/scholarship";

export const CHECKLIST_STORAGE_KEY = "scholarmatch:checklist";
export const CHECKLIST_SCHEMA_VERSION = 1;

export interface TrackableItem {
  id: string;
  label: string;
  category: PreparationCategory;
}

/**
 * The rows the tracker offers for one award.
 *
 * Only required items are trackable — they are the ones with a deadline.
 * Because these ids and labels must stay identical to the readiness checklist
 * (`assessReadiness` builders), `verify:preparation` asserts every row matches
 * a requirement the assessment produces for the same award.
 */
export function trackableItems(scholarship: Scholarship): TrackableItem[] {
  const items: TrackableItem[] = [
    {
      id: "eligibility",
      label: "Meet the published eligibility rules",
      category: "eligibility",
    },
  ];

  if (scholarship.gpa !== 0) {
    items.push({
      id: "academic",
      label: "Meet the academic requirement",
      category: "academic",
    });
  }

  if (scholarship.languageTests.length > 0) {
    items.push({
      id: "language",
      label: `Meet the language requirement (${scholarship.languageTests.map((test) => test.toUpperCase()).join(" or ")})`,
      category: "language",
    });
  }

  items.push(
    {
      id: "deadline",
      label: "Know the application deadline",
      category: "application",
    },
    {
      id: "application-guidance",
      label: "Know how to apply",
      category: "application",
    },
  );

  for (const document of scholarship.documents) {
    if (document.requirement !== "required") continue;
    items.push({
      id: `doc:${document.id}`,
      label: document.label,
      category: categoryFor(document),
    });
  }

  return items;
}

/* ==========================================================================
   Storage
   --------------------------------------------------------------------------
   Stored value is `{ version: 1, records: { [scholarshipId]: string[] } }`
   where the array holds the ids of that record's marked rows. Any malformed
   value is treated as empty rather than breaking the page, mirroring the
   tolerant parse the saved-opportunities store already uses.
   ========================================================================== */

export interface ChecklistRecords {
  version: number;
  records: Record<string, string[]>;
}

export function parseChecklist(raw: string | null): ChecklistRecords {
  const empty = (): ChecklistRecords => ({
    version: CHECKLIST_SCHEMA_VERSION,
    records: {},
  });

  if (raw === null) return empty();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty();
  }

  if (typeof parsed !== "object" || parsed === null) return empty();

  const records = (parsed as { records?: unknown }).records;
  if (typeof records !== "object" || records === null) return empty();

  const out: Record<string, string[]> = {};
  for (const [scholarshipId, value] of Object.entries(records as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const ids = value.filter((entry): entry is string => typeof entry === "string");
    if (ids.length === 0) continue;

    const unique = [...new Set(ids)];
    if (unique.length > 0) out[scholarshipId] = unique;
  }

  return { version: CHECKLIST_SCHEMA_VERSION, records: out };
}

export function serializeChecklist(records: ChecklistRecords): string {
  return JSON.stringify(records);
}

/** Read-only set of marked ids for one scholarship. */
export function marksFor(records: ChecklistRecords, scholarshipId: string): ReadonlySet<string> {
  const marked = records.records[scholarshipId];
  return marked ? new Set(marked) : EMPTY_MARKS;
}

const EMPTY_MARKS: ReadonlySet<string> = new Set<string>();

/**
 * The records after toggling one row for one scholarship.
 *
 * An id already present is removed; an absent one is added. Other awards'
 * records are preserved untouched.
 */
export function toggleMark(
  records: ChecklistRecords,
  scholarshipId: string,
  requirementId: string,
): ChecklistRecords {
  const before = new Set(records.records[scholarshipId] ?? []);
  const after = new Set(before);

  if (after.has(requirementId)) after.delete(requirementId);
  else after.add(requirementId);

  return {
    version: records.version,
    records: { ...records.records, [scholarshipId]: [...after] },
  };
}

/** Convenience: the label used for a trackable row's category badge. */
export function trackableCategoryLabel(category: PreparationCategory): string {
  return PREPARATION_CATEGORY_LABEL[category];
}