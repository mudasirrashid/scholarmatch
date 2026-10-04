"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

/**
 * Saved-opportunity state for Phase 02.
 *
 * Persisted to `localStorage` rather than any account system, because
 * authentication arrives in a later phase. The context is deliberately the only
 * thing the UI depends on: swapping the backing store for an API is a change
 * inside this file only.
 *
 * `localStorage` is an external store, so it is read through
 * `useSyncExternalStore` instead of an effect. That keeps the server-rendered
 * markup and the first client render in agreement, avoids a hydration flash,
 * and means the read never blocks paint.
 */

const STORAGE_KEY = "scholarmatch:saved";

interface SavedContextValue {
  /** Ids of saved opportunities. */
  saved: ReadonlySet<string>;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

/** Stable empty reference, so the server snapshot never changes identity. */
const EMPTY: ReadonlySet<string> = new Set<string>();

/**
 * `getSnapshot` must return a referentially stable value for unchanged data or
 * React re-renders forever. The parsed set is therefore cached against the raw
 * stored string.
 */
let cachedRaw: string | null = null;
let cachedSnapshot: ReadonlySet<string> = EMPTY;

function parse(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    // Malformed value: treat as empty rather than breaking the page.
    return [];
  }
}

function getSnapshot(): ReadonlySet<string> {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing modes and blocked storage both throw here.
    return cachedSnapshot;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = new Set(parse(raw));
  }

  return cachedSnapshot;
}

function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
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

/** Writes the new set and republishes it. */
function write(ids: readonly string[]): void {
  const raw = JSON.stringify([...ids]);

  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage unavailable: the cache below still drives this session.
  }

  // The cache is updated either way, so an in-memory session works even when
  // the write failed.
  cachedRaw = raw;
  cachedSnapshot = new Set(ids);
  notify();
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Reading the live snapshot inside each callback, rather than closing over
  // `saved`, keeps these identities stable and avoids stale writes.
  const toggle = useCallback((id: string) => {
    const next = new Set(getSnapshot());

    if (next.has(id)) next.delete(id);
    else next.add(id);

    write([...next]);
  }, []);

  const remove = useCallback((id: string) => {
    const current = getSnapshot();
    if (!current.has(id)) return;

    const next = new Set(current);
    next.delete(id);
    write([...next]);
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<SavedContextValue>(
    () => ({
      saved,
      isSaved: (id: string) => saved.has(id),
      toggle,
      remove,
      clear,
    }),
    [saved, toggle, remove, clear],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

/**
 * Reads saved state.
 *
 * Throws rather than returning a fallback when no provider is present: a save
 * button rendered outside the provider is a wiring mistake that should surface
 * immediately rather than silently do nothing.
 */
export function useSaved(): SavedContextValue {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error("useSaved must be used inside a SavedProvider");
  }
  return context;
}