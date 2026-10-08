"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import {
  CHECKLIST_SCHEMA_VERSION,
  CHECKLIST_STORAGE_KEY,
  marksFor,
  parseChecklist,
  serializeChecklist,
  toggleMark,
  trackableCategoryLabel,
  trackableItems,
} from "@/lib/preparation/tracker";

import type { ChecklistRecords } from "@/lib/preparation/tracker";
import type { Scholarship } from "@/types/scholarship";

/**
 * A visitor's own preparation checklist for one award.
 *
 * `localStorage` is an external store, so it is read through
 * `useSyncExternalStore` exactly like the saved-opportunities store: the server
 * markup always renders the neutral placeholder, hydration agrees with it, and
 * the real rows appear only when the client snapshot diverges. Marks are
 * personal data, so none of them ever ship in the server HTML.
 *
 * The tracker is separate from the readiness figure by design. Ticking a row
 * records preparation on this device only — it never changes the printed
 * figure, which stays a fact about the profile and the provider's published
 * requirements.
 */

const EMPTY_RECORDS: ChecklistRecords = {
  version: CHECKLIST_SCHEMA_VERSION,
  records: {},
};

const SERVER_SNAPSHOT: ChecklistRecords = EMPTY_RECORDS;

let cachedRaw: string | null | undefined;
let cachedRecords: ChecklistRecords = EMPTY_RECORDS;

function readStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): ChecklistRecords {
  const raw = readStorage();

  if (raw === cachedRaw) return cachedRecords;

  cachedRaw = raw;
  cachedRecords = parseChecklist(raw);
  return cachedRecords;
}

function getServerSnapshot(): ChecklistRecords {
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
  cachedRaw = undefined;
  for (const listener of listeners) listener();
}

/** Writes new records and republishes them. */
function write(records: ChecklistRecords): void {
  try {
    window.localStorage.setItem(CHECKLIST_STORAGE_KEY, serializeChecklist(records));
  } catch {
    // Storage unavailable (private browsing, quota): the toggle is not
    // persisted, and the read path below still serves this session.
  }
  notify();
}

export function useChecklist(): { records: ChecklistRecords; isHydrated: boolean } {
  const records = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { records, isHydrated: records !== SERVER_SNAPSHOT };
}

function TrackerSkeleton() {
  return (
    <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
      <div aria-hidden="true" className="shimmer h-3 w-36 rounded-full" />
      <div aria-hidden="true" className="shimmer mt-4 h-3 w-2/3 rounded-full" />
      <div aria-hidden="true" className="shimmer mt-3 h-3 w-1/2 rounded-full" />
      <div aria-hidden="true" className="shimmer mt-5 h-10 rounded-xl" />
      <div aria-hidden="true" className="shimmer mt-2 h-10 rounded-xl" />
      <div aria-hidden="true" className="shimmer mt-2 h-10 rounded-xl" />
    </div>
  );
}

export function ReadinessTracker({ scholarship }: { scholarship: Scholarship }) {
  const { records, isHydrated } = useChecklist();

  const items = useMemo(() => trackableItems(scholarship), [scholarship]);
  const marks = useMemo(() => marksFor(records, scholarship.id), [records, scholarship.id]);

  const toggle = useCallback(
    (requirementId: string) => {
      write(toggleMark(getSnapshot(), scholarship.id, requirementId));
    },
    [scholarship.id],
  );

  if (!isHydrated) {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Reading your saved checklist
        </span>
        <TrackerSkeleton />
      </div>
    );
  }

  const markedCount = items.reduce((count, item) => (marks.has(item.id) ? count + 1 : count), 0);

  return (
    <section className="mt-8" aria-label="Your preparation tracker">
      <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-mist-50">
          Your preparation tracker
          {markedCount > 0 && (
            <span className="rounded-full border border-azure-400/30 bg-azure-400/10 px-2.5 py-0.5 text-xs font-medium text-azure-200">
              {markedCount} of {items.length} marked
            </span>
          )}
        </h3>

        <p className="mt-2 max-w-prose text-sm text-mist-300">
          Tick what you have in hand. This list is saved in this browser only and
          never changes the readiness figure above, which is still based on your
          profile and the provider&apos;s published requirements.
        </p>

        <ul className="mt-5 divide-y divide-hairline">
          {items.map((item) => {
            const checked = marks.has(item.id);
            return (
              <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <label
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-1 py-1",
                    "transition-colors duration-200 hover:bg-white/[0.04]",
                    "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-azure-300",
                    "group/check",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                    className="peer size-4 shrink-0 appearance-none rounded-[0.25rem] border border-hairline-strong bg-white/[0.04] transition-colors duration-200 checked:border-azure-400 checked:bg-azure-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
                    aria-describedby={checked ? "tracker-marked-count" : undefined}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm transition-colors duration-200",
                        checked ? "text-mist-50" : "text-mist-300",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-mist-400">
                      {trackableCategoryLabel(item.category)}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <p id="tracker-marked-count" className="mt-4 text-xs text-mist-400">
          {markedCount} of {items.length} marked in this browser. Saved on this
          device only — clear it with your browser&apos;s site data.
        </p>
      </div>
    </section>
  );
}