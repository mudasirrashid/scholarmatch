"use client";

import { ActiveFilterChips } from "@/components/scholarships/active-filter-chips";
import { FilterPanel } from "@/components/scholarships/filter-panel";
import { SearchField } from "@/components/scholarships/search-field";
import { SortControl } from "@/components/scholarships/sort-control";
import { useQuerySync } from "@/components/scholarships/use-query-sync";
import { Container } from "@/components/ui/container";
import type { ExplorerQuery } from "@/types/scholarship";

/**
 * Interactive shell of the explorer.
 *
 * Owns every control that writes to the URL and receives the result grid as
 * `children`, which stay server-rendered. That split is deliberate: the dataset
 * never ships to the browser, and the page still renders complete with no
 * JavaScript because the server also honours the same query params.
 */
export function ExplorerShell({
  query,
  fields,
  countries,
  resultCount,
  totalCount,
  children,
}: {
  query: ExplorerQuery;
  fields: readonly string[];
  countries: readonly string[];
  resultCount: number;
  totalCount: number;
  children: React.ReactNode;
}) {
  const { push, pushDebounced, pending } = useQuerySync();

  /** Filter toggles replace the entry so Back steps through filter changes. */
  const onFilterChange = (next: ExplorerQuery) => push(next);
  const onSearchChange = (next: ExplorerQuery) => pushDebounced(next);

  const narrowed = resultCount < totalCount;

  return (
    <>
      {/* Control surface */}
      <div className="relative z-30 border-b border-hairline-soft bg-ink-950/80 backdrop-blur-xl">
        <Container size="wide" className="py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="lg:w-[26rem] lg:shrink-0">
              <SearchField query={query} onChange={onSearchChange} />
            </div>

            <div className="hidden flex-1 lg:block">
              <ActiveFilterChips query={query} onChange={onFilterChange} />
            </div>
          </div>
        </Container>
      </div>

      {/* Results */}
      <Container size="wide" className="py-8 lg:py-10">
        {/*
          Stacked below `lg`, where the filter panel is a full-width trigger
          above the results. As a row it sat *beside* them, squeezing the grid
          into a fraction of the viewport and pushing cards off the right edge.
        */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <FilterPanel
            query={query}
            onChange={onFilterChange}
            fields={fields}
            countries={countries}
          />

          <div className="min-w-0 flex-1">
            {/* Result summary */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-micro text-mist-500">
                  {resultCount === totalCount ? "All opportunities" : "Filtered results"}
                </p>
                <p className="mt-2 font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl">
                  {resultCount}{" "}
                  <span className="text-mist-500">
                    {resultCount === 1 ? "opportunity" : "opportunities"}
                  </span>
                </p>
                <p className="mt-2 text-sm text-pretty text-mist-500">
                  {narrowed
                    ? "Showing opportunities relevant to your selected criteria."
                    : "Showing every opportunity currently open to applications."}
                </p>
              </div>

              <SortControl query={query} onChange={onFilterChange} pending={pending} />
            </div>

            {/* Mobile chips sit below the summary, where there is room for them. */}
            <div className="mb-6 lg:hidden">
              <ActiveFilterChips query={query} onChange={onFilterChange} />
            </div>

            {children}
          </div>
        </div>
      </Container>
    </>
  );
}