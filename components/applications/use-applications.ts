"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  APPLICATIONS_SCHEMA_VERSION,
  APPLICATIONS_STORAGE_KEY,
  parseApplications,
  serializeApplications,
  setApplicationNote,
  setApplicationStatus,
  trackApplication,
  untrackApplication,
} from "@/lib/applications";

import type { ApplicationRecords } from "@/lib/applications";
import type { ApplicationStatus } from "@/types/application";

/**
 * Application tracking store, read through `useSyncExternalStore`.
 *
 * `localStorage` is an external store, so it is read the same way the saved
 * opportunities and the preparation checklist are: the server markup always
 * renders the empty snapshot, hydration agrees with it, and real records
 * appear only when the client snapshot diverges. Statuses and notes are
 * personal data, so none of them ever ship in the server HTML.
 */

const EMPTY_RECORDS: ApplicationRecords = {
  version: APPLICATIONS_SCHEMA_VERSION,
  records: {},
};

const SERVER_SNAPSHOT: ApplicationRecords = EMPTY_RECORDS;

let cachedRaw: string | null | undefined;
let cachedRecords: ApplicationRecords = EMPTY_RECORDS;

function readStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): ApplicationRecords {
  const raw = readStorage();

  if (raw === cachedRaw) return cachedRecords;

  cachedRaw = raw;
  cachedRecords = parseApplications(raw);
  return cachedRecords;
}

function getServerSnapshot(): ApplicationRecords {
  return SERVER_SNAPSHOT;
}

/** Same-tab subscribers, since `storage` only fires in *other* tabs. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notify(): void {
  // Force the next `getSnapshot` to re-read rather than serving the cache.
  cachedRaw = undefined;
  for (const listener of listeners) listener();
}

function write(records: ApplicationRecords): void {
  try {
    window.localStorage.setItem(APPLICATIONS_STORAGE_KEY, serializeApplications(records));
  } catch {
    // Storage unavailable (private browsing, quota): the cache below still
    // serves this session, exactly like the checklist store.
  }
  notify();
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Live tracking store. Every mutation writes the full next state to
 * `localStorage`, so a reload and a new tab see the same records.
 */
export function useApplications() {
  const records = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isHydrated = records !== SERVER_SNAPSHOT;

  // Mutations read the live snapshot inside the callback rather than closing
  // over `records`, so their identities stay stable across renders.
  const track = useCallback((scholarshipId: string) => {
    write(trackApplication(getSnapshot(), scholarshipId, now()));
  }, []);

  const untrack = useCallback((scholarshipId: string) => {
    write(untrackApplication(getSnapshot(), scholarshipId));
  }, []);

  const setStatus = useCallback((scholarshipId: string, status: ApplicationStatus) => {
    write(setApplicationStatus(getSnapshot(), scholarshipId, status, now()));
  }, []);

  const setNote = useCallback((scholarshipId: string, note: string) => {
    write(setApplicationNote(getSnapshot(), scholarshipId, note, now()));
  }, []);

  return { records, isHydrated, track, untrack, setStatus, setNote };
}