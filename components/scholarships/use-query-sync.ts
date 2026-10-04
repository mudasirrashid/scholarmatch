"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { ExplorerQuery, SortKey } from "@/types/scholarship";
import { queryToParams } from "@/lib/scholarships/query";

/**
 * Synchronises explorer state with the URL.
 *
 * The URL is the single source of truth so a filtered view is shareable,
 * survives a refresh and renders correctly on the server with no JavaScript at
 * all. This hook owns the write path only; reads come from the server, which is
 * why it takes no current query.
 */
export function useQuerySync() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (next: ExplorerQuery, options?: { replace?: boolean }) => {
      const params = queryToParams(next);
      const search = params.toString();
      const url = search ? `/scholarships?${search}` : "/scholarships";

      startTransition(() => {
        if (options?.replace) {
          router.replace(url, { scroll: false });
        } else {
          router.push(url, { scroll: false });
        }
      });
    },
    [router],
  );

  // Debounced variant for the search field, where every keystroke would
  // otherwise push a history entry.
  const pushDebounced = useCallback(
    (next: ExplorerQuery) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => push(next, { replace: true }), 260);
    },
    [push],
  );

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  return { push, pushDebounced, pending };
}

/**
 * Local mirror of the search box value.
 *
 * Keeps typing responsive while the URL catches up, and re-syncs whenever the
 * server sends a different query (for example after clearing filters).
 */
export function useSearchValue(initial: string) {
  const [value, setValue] = useState(initial);
  const lastInitial = useRef(initial);

  useEffect(() => {
    if (initial !== lastInitial.current) {
      lastInitial.current = initial;
      setValue(initial);
    }
  }, [initial]);

  return [value, setValue] as const;
}

/**
 * Toggles one value inside a multi-select filter group.
 *
 * Returns a new query object rather than mutating, so React sees a fresh
 * reference and the previous state stays intact for the transition.
 */
export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export type { SortKey };