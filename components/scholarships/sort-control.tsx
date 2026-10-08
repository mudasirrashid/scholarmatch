"use client";

import { ChevronDown } from "lucide-react";

import { SORT_OPTIONS } from "@/lib/scholarships/filters";
import type { ExplorerQuery, SortKey } from "@/types/scholarship";

/**
 * Sort control.
 *
 * A native `<select>` with a custom chevron, so it inherits correct keyboard
 * handling, screen reader support and the platform picker on mobile.
 */
export function SortControl({
  query,
  onChange,
  pending,
}: {
  query: ExplorerQuery;
  onChange: (next: ExplorerQuery) => void;
  /** Dims the control while a new result set is being resolved. */
  pending: boolean;
}) {
  return (
    <div className="relative">
      <label htmlFor="scholarmatch-sort" className="sr-only">
        Sort results
      </label>

      <select
        id="scholarmatch-sort"
        value={query.sort}
        onChange={(event) => onChange({ ...query, sort: event.target.value as SortKey })}
        className="h-9 cursor-pointer appearance-none rounded-full border border-hairline bg-tint/[0.04] pr-9 pl-3.5 text-[0.8125rem] text-mist-200 transition-[border-color,background-color,opacity] duration-[240ms] hover:border-hairline-strong hover:bg-tint/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300 [&>option]:bg-ink-900 [&>option]:text-mist-100"
        style={{ opacity: pending ? 0.6 : 1 }}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-mist-400"
        aria-hidden="true"
      />
    </div>
  );
}