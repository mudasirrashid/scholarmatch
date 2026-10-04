"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  FilterCheckbox,
  FilterGroup,
} from "@/components/scholarships/filter-controls";
import { toggleInList } from "@/components/scholarships/use-query-sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  DEADLINE_OPTIONS,
  DEGREE_OPTIONS,
  FUNDING_OPTIONS,
  GPA_OPTIONS,
  LANGUAGE_NO_TEST,
  LANGUAGE_OPTIONS,
} from "@/lib/scholarships/filters";
import { countActiveFilters, isDefaultQuery } from "@/lib/scholarships/query";
import { fieldLabel } from "@/lib/scholarships";
import type {
  DeadlineWindow,
  DegreeFilter,
  ExplorerQuery,
  FundingTier,
  GpaRequirement,
  LanguageTest,
} from "@/types/scholarship";

/** Ties the mobile trigger to the sheet it opens. */
const SHEET_ID = "scholarmatch-filter-sheet";

interface FilterPanelProps {
  query: ExplorerQuery;
  onChange: (next: ExplorerQuery) => void;
  fields: readonly string[];
  countries: readonly string[];
}

/**
 * The filter surface, rendered identically inside the desktop sidebar and the
 * mobile drawer.
 *
 * Drawn from one component so the two can never drift apart, and so every
 * control is a native checkbox with a label rather than a custom widget.
 */
function FilterBody({
  query,
  onChange,
  fields,
  countries,
  onClear,
  idPrefix,
}: FilterPanelProps & {
  onClear: () => void;
  idPrefix: string;
}) {
  const groupCounts: Record<string, number> = {
    degree: query.degree.length,
    field: query.fields.length,
    country: query.countries.length,
    funding: query.funding.length,
    deadline: query.deadlines.length,
    gpa: query.gpa.length,
    language: query.language.length,
  };

  return (
    <div className="flex flex-col">
      <FilterGroup title="Degree" count={groupCounts.degree}>
        {DEGREE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            name={`${idPrefix}-degree-${option.value}`}
            label={option.label}
            checked={query.degree.includes(option.value)}
            onChange={() => onChange({ ...query, degree: toggleInList(query.degree, option.value) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Study Field" count={groupCounts.field} defaultOpen={false}>
        {fields.map((field) => (
          <FilterCheckbox
            key={field}
            name={`${idPrefix}-field-${field}`}
            label={fieldLabel(field)}
            checked={query.fields.includes(field)}
            onChange={() => onChange({ ...query, fields: toggleInList(query.fields, field) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Country" count={groupCounts.country} defaultOpen={false}>
        {countries.map((country) => (
          <FilterCheckbox
            key={country}
            name={`${idPrefix}-country-${country}`}
            label={fieldLabel(country)}
            checked={query.countries.includes(country)}
            onChange={() =>
              onChange({ ...query, countries: toggleInList(query.countries, country) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Funding" count={groupCounts.funding} defaultOpen={false}>
        {FUNDING_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            name={`${idPrefix}-funding-${option.value}`}
            label={option.label}
            checked={query.funding.includes(option.value)}
            onChange={() =>
              onChange({ ...query, funding: toggleInList(query.funding, option.value) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Deadline" count={groupCounts.deadline}>
        {DEADLINE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            name={`${idPrefix}-deadline-${option.value}`}
            label={option.label}
            hint={option.hint}
            checked={query.deadlines.includes(option.value)}
            onChange={() =>
              onChange({ ...query, deadlines: toggleInList(query.deadlines, option.value) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="GPA" count={groupCounts.gpa} defaultOpen={false}>
        {GPA_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            name={`${idPrefix}-gpa-${option.value}`}
            label={option.label}
            checked={query.gpa.includes(option.value as GpaRequirement)}
            onChange={() =>
              onChange({ ...query, gpa: toggleInList(query.gpa, option.value as GpaRequirement) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Language" count={groupCounts.language} defaultOpen={false}>
        {LANGUAGE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            name={`${idPrefix}-lang-${option.value}`}
            label={option.label}
            checked={query.language.includes(option.value as LanguageTest)}
            onChange={() =>
              onChange({
                ...query,
                language: toggleInList(query.language, option.value as LanguageTest),
              })
            }
          />
        ))}
        <FilterCheckbox
          name={`${idPrefix}-lang-none`}
          label={LANGUAGE_NO_TEST.label}
          checked={query.language.includes(LANGUAGE_NO_TEST.value as LanguageTest)}
          onChange={() =>
            onChange({
              ...query,
              language: toggleInList(query.language, LANGUAGE_NO_TEST.value as LanguageTest),
            })
          }
        />
      </FilterGroup>

      <div className="pt-5">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClear}
          disabled={isDefaultQuery(query)}
          className="w-full"
        >
          Clear all filters
        </Button>
      </div>
    </div>
  );
}

/**
 * Explorer filter surface: a persistent sidebar on desktop, a sheet on mobile.
 *
 * The sheet locks body scroll, closes on Escape and on backdrop click, and
 * returns focus to the trigger when dismissed — the behaviours a dialog needs
 * to be usable with a keyboard.
 */
export function FilterPanel({ query, onChange, fields, countries }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const activeCount = countActiveFilters(query);
  const clear = useCallback(
    () =>
      onChange({
        q: "",
        degree: [],
        fields: [],
        countries: [],
        funding: [],
        deadlines: [],
        gpa: [],
        language: [],
        sort: query.sort,
      }),
    [onChange, query.sort],
  );

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    /* Move focus into the sheet. Without this, `aria-modal` is a lie: focus
       would still sit on the trigger behind the overlay, so the next Tab would
       walk the page underneath instead of the filters. */
    const raf = requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }

      /* Focus trap. `aria-modal="true"` promises the rest of the page is
         unreachable, so Tab has to cycle within the sheet to honour it. */
      if (event.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;

      const focusable = [
        ...sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !sheet.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // Compensate for the scrollbar so the page does not shift on open.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [open, close]);

  return (
    <>
      {/* Desktop: always visible */}
      <aside
        className="hidden shrink-0 lg:block lg:w-[17.5rem]"
        aria-label="Filter scholarships"
      >
        <div className="surface-glass sticky top-28 rounded-2xl p-5">
          <div className="mb-1 flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-azure-300" aria-hidden="true" />
            <h2 className="text-sm font-medium text-mist-100">Filters</h2>
            {activeCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-azure-400/15 font-mono text-[0.625rem] text-azure-200">
                {activeCount}
              </span>
            ) : null}
          </div>

          <FilterBody
            query={query}
            onChange={onChange}
            fields={fields}
            countries={countries}
            onClear={clear}
            idPrefix="lg"
          />
        </div>
      </aside>

      {/* Mobile: sheet trigger */}
      <div className="lg:hidden">
        <Button
          ref={triggerRef}
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={SHEET_ID}
          className="w-full"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
          {activeCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-azure-400/20 font-mono text-[0.625rem] text-azure-100">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          "fixed inset-0 z-100 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity duration-[320ms]",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={close}
          aria-hidden="true"
        />

        <div
          id={SHEET_ID}
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Filter scholarships"
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col",
            "rounded-t-3xl border-t border-hairline-strong bg-ink-900 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.9)]",
            "transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-y-0" : "translate-y-full",
          )}
          /* Off-screen when closed, so it must not be reachable by Tab. */
          {...(open ? {} : { inert: true })}
        >
          {/* Grab handle doubles as the drag affordance cue. */}
          <div className="flex shrink-0 justify-center pt-3">
            <span className="h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-medium text-mist-50">
              <SlidersHorizontal className="size-4 text-azure-300" aria-hidden="true" />
              Filters
            </h2>
            <button
              type="button"
              ref={closeRef}
              onClick={close}
              aria-label="Close filters"
              className="grid size-8 place-items-center rounded-full text-mist-400 transition-colors duration-200 hover:bg-white/[0.08] hover:text-mist-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
            <FilterBody
              query={query}
              onChange={onChange}
              fields={fields}
              countries={countries}
              onClear={clear}
              idPrefix="sm"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export type { DeadlineWindow, DegreeFilter, FundingTier };