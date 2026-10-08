"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Theme preference for the dark/bright switch.
 *
 * Persisted to `localStorage` under a key that is deliberately separate from
 * any other preference store, so theme switching can never touch the
 * visitor's other data. The choice is applied to `<html data-theme="...">` by
 * a pre-paint script in app/layout.tsx before anything renders; this module is
 * only the source of truth for the toggle's own icon and label, and for
 * cross-tab sync.
 *
 * `localStorage` is an external store, so it is read through
 * `useSyncExternalStore` exactly like the saved-opportunities and profile
 * stores: the server-rendered markup and the first client render stay in
 * agreement, and the read never blocks paint.
 */

export const THEME_KEY = "scholarmatch:theme";

export type Theme = "dark" | "light";

/** Dark is the authored baseline: absent or malformed values resolve to it. */
export const DEFAULT_THEME: Theme = "dark";

interface ThemeSnapshot {
  theme: Theme;
}

/** Frozen and shared by identity: `isHydrated` is decided by comparing against
 *  this, which is why it must be the same object every call. */
const SERVER_SNAPSHOT: ThemeSnapshot = Object.freeze({ theme: DEFAULT_THEME });

let cachedRaw: Theme | null = null;
let cachedSnapshot: ThemeSnapshot = SERVER_SNAPSHOT;

function parse(raw: string | null): Theme {
  return raw === "light" ? "light" : "dark";
}

function getSnapshot(): ThemeSnapshot {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(THEME_KEY);
  } catch {
    // Private browsing modes and blocked storage both throw here. Treated as
    // "no stored theme", with the current snapshot returned as-is.
    return cachedSnapshot;
  }

  if (raw !== cachedRaw) {
    cachedRaw = parse(raw);
    cachedSnapshot = { theme: cachedRaw };
  }

  return cachedSnapshot;
}

/** The server has no stored theme, so it always reports the dark baseline. */
function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

/** Same-tab subscribers, since `storage` only fires in *other* tabs. */
const listeners = new Set<() => void>();

function applyStoredTheme(): void {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark") {
      document.documentElement.setAttribute("data-theme", raw);
    }
  } catch {
    // Storage unavailable; the current session keeps whatever it had.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = () => {
    applyStoredTheme();
    listener();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * The crossfade that plays when the toggle flips the theme.
 *
 * `null` while no transition is running, so a second click inside the first
 * transition's window applies the new value directly instead of stacking
 * transitions (the browser would abort the older one and the page would
 * flicker).
 */
let activeTransition: ViewTransition | null = null;

/**
 * Applies the attribute, optionally crossfading the whole page into it.
 *
 * The update callback is deliberately synchronous. It runs at the next
 * rendering opportunity, which is after the click handler that scheduled the
 * toggle has finished and React has already committed the new icon — so the
 * "after" snapshot already contains the switched control. Waiting on
 * `requestAnimationFrame` instead would gate the transition on frames being
 * produced at all, and a background or throttled tab produces none: the
 * browser would time the update out with a visible console error. There is
 * nothing left to wait for, so the transition can never hang.
 */
function applyToDocument(theme: Theme): void {
  const flip = () => {
    document.documentElement.setAttribute("data-theme", theme);
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canCrossfade =
    !reducedMotion &&
    activeTransition === null &&
    typeof document.startViewTransition === "function";

  if (!canCrossfade) {
    flip();
    return;
  }

  const transition = document.startViewTransition(() => flip());
  activeTransition = transition;

  const release = () => {
    if (activeTransition === transition) activeTransition = null;
  };

  // A transition can be skipped, aborted (tab hidden mid-flip) or denied
  // (another one still holding the page); none of that is a failure worth
  // reporting to the visitor.
  transition.ready.catch(() => {});
  transition.finished.then(release, release);
}

/** Applies the choice and republishes it. */
function write(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable: still apply to the document and update the cache so
    // the preference drives this session before it is ever persisted.
  }

  applyToDocument(theme);
  cachedRaw = theme;
  cachedSnapshot = { theme };
  notify();
}

export function useTheme(): {
  theme: Theme;
  isHydrated: boolean;
  toggle: () => void;
} {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    write(getSnapshot().theme === "dark" ? "light" : "dark");
  }, []);

  // Identity comparison against the frozen server snapshot.
  return {
    theme: stored.theme,
    isHydrated: stored !== SERVER_SNAPSHOT,
    toggle,
  };
}