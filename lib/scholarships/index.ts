/**
 * Read helpers over the scholarship collection.
 *
 * The explorer needs a compact projection for cards while the detail page
 * needs the whole record, so `toPreview` (in `./preview`) is the single place
 * that narrows a full record for Phase 01's `ScholarshipPreview` consumers.
 */

import { scholarships } from "@/lib/demo/data";
import { deadlineWindow } from "@/lib/scholarships/query";
import type { DegreeFilter } from "@/types/scholarship";

export { daysUntil, scoreForStatus, toPreview } from "@/lib/scholarships/preview";

/** Every record, in authored order. */
export function allScholarships() {
  return scholarships;
}

/** Looks up a single record by id. Returns undefined for unknown ids. */
export function getScholarship(id: string) {
  return scholarships.find((scholarship) => scholarship.id === id);
}

/** Distinct degree levels present in the dataset, in canonical order. */
export function availableDegrees(): DegreeFilter[] {
  const order: DegreeFilter[] = ["bachelors", "masters", "doctorate"];
  return order.filter((level) =>
    scholarships.some((scholarship) =>
      (scholarship.degreeLevels as readonly DegreeFilter[]).includes(level),
    ),
  );
}

/**
 * Distinct study fields present, alphabetically, de-duplicated.
 *
 * Lower-cased to match the normalised tokens the URL carries; `fieldLabel`
 * turns a token back into its display form.
 */
export function availableFields(): string[] {
  return [
    ...new Set(scholarships.flatMap((scholarship) => scholarship.fields.map((f) => f.toLowerCase()))),
  ].sort();
}

/**
 * Distinct countries present, alphabetically, de-duplicated.
 *
 * Lower-cased for the same reason as `availableFields`, so the value used as a
 * checkbox and the value compared in `filterScholarships` cannot drift apart.
 */
export function availableCountries(): string[] {
  return [
    ...new Set(scholarships.map((scholarship) => scholarship.country.toLowerCase())),
  ].sort();
}

/** Turns a normalised field or country token into its display form. */
export function fieldLabel(token: string): string {
  const match = scholarships
    .flatMap((scholarship) => [...scholarship.fields, scholarship.country])
    .find((value) => value.toLowerCase() === token.toLowerCase());

  return match ?? token;
}

/** Deadline buckets that at least one record falls into, in bucket order. */
export function availableDeadlineWindows(): string[] {
  const present = new Set(
    scholarships.map((scholarship) => deadlineWindow(scholarship.deadline)),
  );
  return (["closing_soon", "this_month", "next_three_months", "later"] as const).filter((window) =>
    present.has(window),
  );
}