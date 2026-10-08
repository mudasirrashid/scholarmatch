/**
 * In-browser application tracking store.
 *
 * The decision of where one application sits (interested, preparing, applied,
 * …) is a visitor's own record, persisted to `localStorage` exactly like the
 * preparation checklist: key `scholarmatch:applications`, schema version 1,
 * shaped `{ version, records: { [scholarshipId]: TrackedApplication } }`.
 *
 * Tracking records what the visitor does with an award; it never feeds back
 * into the match or readiness figures, so the three stay independent (see
 * `types/application.ts`). Everything here is pure and testable — each
 * mutation takes an injected `now` ISO string, so a test calls the same
 * functions the browser calls without a clock getting in the way.
 *
 * Any malformed value is treated as empty rather than breaking the page,
 * mirroring the tolerant parse the checklist store already uses. Terminals
 * (unknown statuses, records whose trackedAt/updatedAt are not strings) are
 * skipped by `parseApplications`.
 */

import { APPLICATION_STATUS_ORDER } from "@/types/application";

import type { ApplicationStatus, TrackedApplication } from "@/types/application";

export const APPLICATIONS_STORAGE_KEY = "scholarmatch:applications";
export const APPLICATIONS_SCHEMA_VERSION = 1;

export interface ApplicationRecords {
  version: number;
  records: Record<string, TrackedApplication>;
}

export type ApplicationMutation = (records: ApplicationRecords) => ApplicationRecords;

const VALID_STATUSES: ReadonlySet<string> = new Set<string>(APPLICATION_STATUS_ORDER);

function empty(): ApplicationRecords {
  return { version: APPLICATIONS_SCHEMA_VERSION, records: {} };
}

function isTrackedApplication(value: unknown): value is TrackedApplication {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.scholarshipId !== "string" || candidate.scholarshipId.length === 0) return false;
  if (typeof candidate.status !== "string" || !VALID_STATUSES.has(candidate.status)) return false;
  if (typeof candidate.trackedAt !== "string" || typeof candidate.updatedAt !== "string") return false;
  if (candidate.note !== undefined && typeof candidate.note !== "string") return false;
  return true;
}

export function parseApplications(raw: string | null): ApplicationRecords {
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

  const out: Record<string, TrackedApplication> = {};
  for (const [scholarshipId, value] of Object.entries(records as Record<string, unknown>)) {
    if (!isTrackedApplication(value)) continue;
    if (value.scholarshipId !== scholarshipId) continue;
    out[scholarshipId] = {
      scholarshipId: value.scholarshipId,
      status: value.status,
      trackedAt: value.trackedAt,
      updatedAt: value.updatedAt,
      ...(value.note !== undefined ? { note: value.note } : {}),
    };
  }

  return { version: APPLICATIONS_SCHEMA_VERSION, records: out };
}

export function serializeApplications(records: ApplicationRecords): string {
  return JSON.stringify(records);
}

/** The stored record for one scholarship, when tracked. */
export function applicationByScholarship(
  records: ApplicationRecords,
  scholarshipId: string,
): TrackedApplication | undefined {
  return records.records[scholarshipId];
}

/**
 * Begins tracking a scholarship at `interested`.
 *
 * Idempotent: an already-tracked award keeps its original `trackedAt` and
 * status, so tapping "Track this application" twice cannot reset progress.
 */
export function trackApplication(
  records: ApplicationRecords,
  scholarshipId: string,
  now: string,
): ApplicationRecords {
  if (records.records[scholarshipId]) return records;
  return {
    ...records,
    records: {
      ...records.records,
      [scholarshipId]: { scholarshipId, status: "interested", trackedAt: now, updatedAt: now },
    },
  };
}

/** Stops tracking a scholarship, removing its record and note. */
export function untrackApplication(records: ApplicationRecords, scholarshipId: string): ApplicationRecords {
  if (!records.records[scholarshipId]) return records;
  const next = { ...records.records };
  delete next[scholarshipId];
  return { ...records, records: next };
}

/** Moves one tracked application to a new status. No-op when not tracked. */
export function setApplicationStatus(
  records: ApplicationRecords,
  scholarshipId: string,
  status: ApplicationStatus,
  now: string,
): ApplicationRecords {
  const current = records.records[scholarshipId];
  if (!current || current.status === status) return records;
  return {
    ...records,
    records: {
      ...records.records,
      [scholarshipId]: { ...current, status, updatedAt: now },
    },
  };
}

/**
 * Records or clears a private note.
 *
 * An empty note removes the field entirely rather than storing a blank string,
 * so an untouched record and a cleared one serialise the same way.
 */
export function setApplicationNote(
  records: ApplicationRecords,
  scholarshipId: string,
  note: string,
  now: string,
): ApplicationRecords {
  const current = records.records[scholarshipId];
  if (!current) return records;
  if ((current.note ?? "") === note) return records;

  const next: TrackedApplication = { ...current, updatedAt: now };
  if (note.length > 0) next.note = note;
  else delete next.note;

  return { ...records, records: { ...records.records, [scholarshipId]: next } };
}