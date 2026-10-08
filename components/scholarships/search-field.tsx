"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";

import { useSearchValue } from "@/components/scholarships/use-query-sync";
import type { ExplorerQuery } from "@/types/scholarship";

/**
 * Explorer search field.
 *
 * The input stays controlled locally and pushes to the URL on a short debounce,
 * so typing never blocks on a transition while results still update behind the
 * user. Clearing resets the value immediately rather than waiting out the
 * debounce, which is what people expect from a clear affordance.
 */
export function SearchField({
  query,
  onChange,
}: {
  query: ExplorerQuery;
  onChange: (next: ExplorerQuery) => void;
}) {
  const inputId = useId();
  const [value, setValue] = useSearchValue(query.q);
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search scholarships, universities and countries
      </label>

      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-500"
        aria-hidden="true"
      />

      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          onChange({ ...query, q: next });
        }}
        placeholder="Search scholarships, universities, countries..."
        autoComplete="off"
        className="h-12 w-full rounded-full border border-hairline bg-white/[0.04] pr-11 pl-11 text-[0.9375rem] text-mist-100 transition-[border-color,background-color,box-shadow] duration-[240ms] placeholder:text-mist-500 hover:border-hairline-strong hover:bg-white/[0.06] focus:border-azure-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-azure-400/12 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />

      {hasValue ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            onChange({ ...query, q: "" });
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-mist-400 transition-colors duration-200 hover:bg-white/[0.08] hover:text-mist-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {query.q ? `Searching for ${query.q}` : ""}
      </span>
    </div>
  );
}