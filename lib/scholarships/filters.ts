/**
 * Filter taxonomy for the explorer.
 *
 * Options are authored here rather than derived from the dataset so that the
 * labels students read stay consistent ("Tuition Coverage", not a raw enum
 * value) and so a filter can be offered for a facet with no current matches.
 */

import type { DeadlineWindow, DegreeFilter, FundingTier, SortKey } from "@/types/scholarship";

export interface FilterOption<T extends string | number> {
  value: T;
  label: string;
  /** Optional trailing count rendered as a hint, never as the primary label. */
  hint?: string;
}

export const SORT_OPTIONS: readonly FilterOption<SortKey>[] = [
  { value: "best_match", label: "Best Match" },
  { value: "deadline_soon", label: "Deadline Soon" },
  { value: "newest", label: "Newest" },
  { value: "fully_funded", label: "Fully Funded" },
  { value: "relevant", label: "Most Relevant" },
];

export const DEGREE_OPTIONS: readonly FilterOption<DegreeFilter>[] = [
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "doctorate", label: "PhD" },
];

export const FUNDING_OPTIONS: readonly FilterOption<FundingTier>[] = [
  { value: "fully_funded", label: "Fully Funded" },
  { value: "tuition_and_partial", label: "Fully Funded / Partial" },
  { value: "tuition_coverage", label: "Tuition Coverage" },
  { value: "stipend", label: "Stipend" },
  { value: "research_funding", label: "Research Funding" },
  { value: "partial", label: "Partial Funding" },
];

export const DEADLINE_OPTIONS: readonly FilterOption<DeadlineWindow>[] = [
  { value: "closing_soon", label: "Closing soon", hint: "Within 3 weeks" },
  { value: "this_month", label: "This month" },
  { value: "next_three_months", label: "Next 3 months" },
  { value: "later", label: "Later" },
];

export const GPA_OPTIONS: readonly FilterOption<number>[] = [
  { value: 0, label: "No minimum" },
  { value: 2.5, label: "2.5+" },
  { value: 3, label: "3.0+" },
  { value: 3.5, label: "3.5+" },
  { value: 3.7, label: "3.7+" },
];

export const LANGUAGE_OPTIONS: readonly FilterOption<string>[] = [
  { value: "ielts", label: "IELTS" },
  { value: "toefl", label: "TOEFL" },
  { value: "duolingo", label: "Duolingo" },
];

/**
 * Matches records that list no language test requirement.
 *
 * Uses the same `"none"` token the query parser accepts, so the option survives
 * a URL round trip instead of being discarded as an unknown value.
 */
export const LANGUAGE_NO_TEST = { value: "none", label: "No language test listed" } as const;

/** Maps every filter group onto the query field it mutates. */
export const FILTER_GROUP_IDS = [
  "degree",
  "field",
  "country",
  "funding",
  "deadline",
  "gpa",
  "language",
] as const;

export type FilterGroupId = (typeof FILTER_GROUP_IDS)[number];

/** Human titles for the collapsible groups. */
export const FILTER_GROUP_TITLES: Record<FilterGroupId, string> = {
  degree: "Degree",
  field: "Study Field",
  country: "Country",
  funding: "Funding",
  deadline: "Deadline",
  gpa: "GPA",
  language: "Language",
};

/**
 * Renders any filter value as the chip label shown in the active-filter row.
 *
 * Country and field tokens are lower-cased for the URL, so their display form is
 * recovered from the dataset rather than title-cased, which would render
 * "Türkiye" as "Türkiye" incorrectly for multi-word names.
 */
export function filterValueLabel(
  group: FilterGroupId,
  value: string | number,
  labelFor: (token: string) => string = (token) => token,
): string {
  switch (group) {
    case "degree":
      return DEGREE_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
    case "field":
    case "country":
      return labelFor(String(value));
    case "funding":
      return FUNDING_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
    case "deadline":
      return DEADLINE_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
    case "gpa":
      return GPA_OPTIONS.find((o) => o.value === Number(value))?.label ?? String(value);
    case "language":
      return LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ??
        (value === LANGUAGE_NO_TEST.value ? LANGUAGE_NO_TEST.label : String(value));
    default:
      return String(value);
  }
}