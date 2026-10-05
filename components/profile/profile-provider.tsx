"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import { parseStoredProfile } from "@/lib/profile/parse";

import type { StudentProfile } from "@/types/student";

/**
 * Student profile state for Phase 03.
 *
 * Persisted to `localStorage`, exactly as `SavedProvider` does for bookmarks.
 * There is no account system yet, so nothing here leaves the browser.
 *
 * This mirrors `saved-provider.tsx` deliberately, including the
 * `useSyncExternalStore` approach: `localStorage` is an external store, and
 * reading it through an effect would mean the server-rendered markup and the
 * first client render disagreed, which shows up as a hydration flash on every
 * score in the UI.
 *
 * The scoring itself is not in this file. `lib/matching` is pure and runs
 * wherever it is called, so the same profile produces the same result on the
 * server and in the browser. When accounts arrive, this provider is the only
 * file that changes.
 */

const STORAGE_KEY = "scholarmatch:profile";

/** Profile used before the visitor has entered anything. */
export const DEFAULT_PROFILE: StudentProfile = { schemaVersion: 1 };

interface ProfileContextValue {
  /** The stored profile. Empty sections are absent rather than blank. */
  profile: StudentProfile;
  /**
   * False while the stored profile is still being read.
   *
   * Callers use this to avoid scoring an empty profile on the first paint and
   * briefly showing "no information yet" to someone who has a saved profile.
   */
  isHydrated: boolean;
  /**
   * True when a stored profile exists but could not be parsed.
   *
   * `parseProfile` rejects an unknown schema version and any section that fails
   * validation, so this covers hand-edited storage as well as data left behind
   * by a different build. It is reported separately from an absent key because
   * the two need different copy: onboarding versus a recovery prompt.
   *
   * Nothing is silently overwritten. The stored value is left untouched until the
   * visitor chooses to rebuild it.
   */
  isUnreadable: boolean;
  /**
   * Merges a patch into the profile and persists it.
   *
   * A merge rather than a replacement so one field can be cleared without having
   * to resend every other section.
   */
  update: (patch: Partial<StudentProfile>) => void;
  /** Replaces the whole profile, used by the demo-profile loader. */
  replace: (profile: StudentProfile) => void;
  /** Returns to an empty profile. */
  clear: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Normalises a parsed profile.
 *
 * Validation lives in `lib/profile/parse` so it can be tested directly and reused
 * once profiles arrive from a server instead of from `localStorage`. An
 * unrecognised or malformed value yields `null`, which becomes the empty profile:
 * a visitor with corrupt storage should see the builder, not a crash.
 */

/** What one read of storage produced. */
interface ProfileSnapshot {
  /** Raw string behind the key, or `null` when the key is absent. */
  raw: string | null;
  /** Parsed profile, or `null` when absent or unparseable. */
  profile: StudentProfile | null;
}

/**
 * `getSnapshot` must be referentially stable for unchanged data, so the parsed
 * object is cached against the raw stored string.
 */
let cachedRaw: string | null = null;
let cachedProfile: StudentProfile | null = null;
let cachedSnapshot: ProfileSnapshot = { raw: null, profile: null };

/**
 * The server has no stored profile, so it always reports the key as absent.
 *
 * Frozen and shared by identity: `isHydrated` is decided by comparing snapshots
 * against this one, which is why it must be the same object every call.
 */
const SERVER_SNAPSHOT: ProfileSnapshot = Object.freeze({
  raw: null,
  profile: null,
});

/**
 * Same idea for storage that cannot be read at all.
 *
 * A separate constant rather than a fresh object, because `getSnapshot` is called
 * on every render and `useSyncExternalStore` requires a stable reference for
 * unchanged data: allocating here would loop forever when storage is blocked.
 */
const BLOCKED_STORAGE_SNAPSHOT: ProfileSnapshot = Object.freeze({
  raw: null,
  profile: null,
});

/** `undefined` is not possible here: absence is represented as `raw: null`. */
function getSnapshot(): ProfileSnapshot {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing and blocked storage both throw. Treated as "no profile",
    // but marked as read so the UI leaves its loading state instead of spinning.
    return BLOCKED_STORAGE_SNAPSHOT;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedProfile = parseStoredProfile(raw);
    cachedSnapshot = { raw, profile: cachedProfile };
  }

  return cachedSnapshot;
}

/** The server never has a stored profile, so it always renders the empty one. */
function getServerSnapshot(): ProfileSnapshot {
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
  for (const listener of listeners) listener();
}

/** Writes the profile and republishes it. */
function write(profile: StudentProfile): void {
  const raw = JSON.stringify(profile);

  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage unavailable: the in-memory cache below still drives this session.
  }

  cachedRaw = raw;
  cachedProfile = profile;
  cachedSnapshot = { raw, profile };
  notify();
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((patch: Partial<StudentProfile>) => {
    const current = getSnapshot().profile ?? DEFAULT_PROFILE;
    write({ ...current, ...patch, schemaVersion: 1 });
  }, []);

  const replace = useCallback((profile: StudentProfile) => {
    write({ ...profile, schemaVersion: 1 });
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do: the cache update below still applies.
    }
    cachedRaw = null;
    cachedProfile = null;
    cachedSnapshot = { raw: null, profile: null };
    notify();
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: stored.profile ?? DEFAULT_PROFILE,
      // Identity comparison against the frozen server snapshot. An absent key
      // still counts as hydrated: the read completed, and there is simply no
      // profile, which callers distinguish from a corrupt one with
      // `isUnreadable`.
      isHydrated: stored !== SERVER_SNAPSHOT,
      isUnreadable: stored.raw !== null && stored.profile === null,
      update,
      replace,
      clear,
    }),
    [stored, update, replace, clear],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/**
 * Reads profile state.
 *
 * Throws outside a provider: a form rendered without one would silently discard
 * a student's answers, which is worse than a visible wiring error.
 */
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside a ProfileProvider");
  }
  return context;
}