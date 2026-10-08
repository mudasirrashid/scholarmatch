import { Bookmark, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ExplorerQuery } from "@/types/scholarship";

/** Neutral query used by both empty states to reset the view. */
function blankQuery(sort: ExplorerQuery["sort"]): ExplorerQuery {
  return {
    q: "",
    degree: [],
    fields: [],
    countries: [],
    funding: [],
    deadlines: [],
    gpa: [],
    language: [],
    sort,
  };
}

/**
 * Empty state for a filtered search with no matches.
 *
 * Framed as "nothing matched these criteria" rather than "no results", because
 * the distinction tells the user whether to change the search or broaden the
 * filters.
 */
export function NoResultsState({
  query,
  onChange,
}: {
  query: ExplorerQuery;
  onChange: (next: ExplorerQuery) => void;
}) {
  return (
    <div className="surface-glass edge-highlight relative overflow-hidden rounded-3xl px-6 py-20 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-azure-400/10 blur-3xl"
      />

      <div className="relative">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-hairline bg-tint/[0.04]">
          <SearchX className="size-6 text-mist-400" aria-hidden="true" />
        </span>

        <h2 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-mist-50">
          No scholarships found
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-pretty text-mist-400">
          Try changing your search or removing a filter. Narrow criteria such as
          a specific country and deadline together can exclude every match.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => onChange(blankQuery(query.sort))}>Clear filters</Button>

          {query.q ? (
            <Button
              variant="secondary"
              onClick={() => onChange({ ...blankQuery(query.sort), q: "" })}
            >
              Clear search only
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state for the saved view.
 *
 * Wired so a real account-backed list can be dropped in later without changing
 * the surrounding layout.
 */
export function NoSavedState({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="surface-glass edge-highlight relative overflow-hidden rounded-3xl px-6 py-20 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-mint-400/10 blur-3xl"
      />

      <div className="relative">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-hairline bg-tint/[0.04]">
          <Bookmark className="size-6 text-mist-400" aria-hidden="true" />
        </span>

        <h2 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-mist-50">
          Nothing saved yet
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-pretty text-mist-400">
          Your saved opportunities will appear here. Saved items are stored on this
          device for now — an account will sync them across devices later.
        </p>

        <Button href="/scholarships" className="mt-8">
          Explore scholarships
        </Button>

        <button
          type="button"
          onClick={onReset}
          className={cn(
            "mt-5 block w-full text-sm text-mist-500",
            "underline decoration-tint/15 underline-offset-4",
            "transition-colors duration-200 hover:text-mist-300",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
          )}
        >
          Reset demo saved items
        </button>
      </div>
    </div>
  );
}