"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

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
 * Keeps only known keys at the top level.
 *
 * Stored JSON is user-writable and survives across schema versions, so it is
 * treated as untrusted input. Nested sections are validated field by field in
 * `parseProfile`; this is the coarse pass that drops anything unexpected.
 */
function isProfile(value: unknown): value is StudentProfile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StudentProfile>;
  return candidate.schemaVersion === 1;
}

/**
 * Normalises a parsed profile.
 *
 * An unrecognised or malformed value yields `null`, which the caller turns into
 * the empty profile. A visitor with corrupt storage should see the builder, not
 * a crash.
 */
function parse(raw: string | null): StudentProfile | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * `getSnapshot` must be referentially stable for unchanged data, so the parsed
 * object is cached against the raw stored string.
 */
let cachedRaw: string | null = null;
let cachedProfile: StudentProfile | null = null;

/** `undefined` means "not read yet", which is what drives `isHydrated`. */
function getSnapshot(): StudentProfile | undefined {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing and blocked storage both throw. Treat as no profile.
    return cachedProfile ?? undefined;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedProfile = parse(raw);
  }

  return cachedProfile ?? undefined;
}

/** The server never has a stored profile, so it always renders the empty one. */
function getServerSnapshot(): StudentProfile | undefined {
  return undefined;
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
  notify();
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((patch: Partial<StudentProfile>) => {
    const current = getSnapshot() ?? DEFAULT_PROFILE;
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
    notify();
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: stored ?? DEFAULT_PROFILE,
      isHydrated: stored !== undefined,
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