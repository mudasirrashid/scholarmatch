"use client";

import { NoResultsState } from "@/components/scholarships/empty-states";
import { useQuerySync } from "@/components/scholarships/use-query-sync";
import type { ExplorerQuery } from "@/types/scholarship";

/**
 * Empty state that can actually clear the view.
 *
 * The server renders this markup for a no-match URL, but clearing filters is an
 * interaction, so the interactive copy lives here and hydrates over the
 * server-rendered shell.
 */
export function NoResultsStateClient({ query }: { query: ExplorerQuery }) {
  const { push } = useQuerySync();

  return (
    <NoResultsState
      query={query}
      onChange={(next) => push(next, { replace: true })}
    />
  );
}