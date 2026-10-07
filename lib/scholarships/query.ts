/**
 * Explorer query parsing, filtering and sorting.
 *
 * Deliberately free of React and of any browser API: the same functions run on
 * the server to render a request and on the client to render an optimistic
 * view of a filter change, so the two can never disagree about the result set.
 *
 * Query state is carried in the URL, which makes every view shareable,
 * bookmarkable and correct without JavaScript.
 */

import type {
  DeadlineWindow,
  DegreeFilter,
  ExplorerQuery,
  FundingTier,
  GpaRequirement,
  LanguageFilter,
  LanguageTest,
  MatchInsights,
  Scholarship,
  SortKey,
} from "@/types/scholarship";

/** Raw `searchParams` as Next.js hands them to a page. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Reference date used to bucket deadlines.
 *
 * Injected rather than read from the clock so that rendering is deterministic
 * and a server render matches the client exactly. A real deployment would
 * pass the build or request time here.
 */
export const QUERY_REFERENCE_DATE = "2026-10-06";

const DEGREE_FILTERS: readonly DegreeFilter[] = ["bachelors", "masters", "doctorate"];
const FUNDING_TIERS: readonly FundingTier[] = [
  "fully_funded",
  "tuition_and_partial",
  "tuition_coverage",
  "partial",
  "stipend",
  "research_funding",
];
const DEADLINE_WINDOWS: readonly DeadlineWindow[] = [
  "closing_soon",
  "this_month",
  "next_three_months",
  "later",
];
const GPA_LEVELS: readonly GpaRequirement[] = [0, 2.5, 3, 3.5, 3.7];
const LANGUAGE_TESTS: readonly LanguageTest[] = ["ielts", "toefl", "duolingo"];

/** Language filter members, including the "no test listed" option. */
const LANGUAGE_FILTERS: readonly LanguageFilter[] = [...LANGUAGE_TESTS, "none"];
const SORT_KEYS: readonly SortKey[] = [
  "best_match",
  "deadline_soon",
  "newest",
  "fully_funded",
  "relevant",
];

/**
 * Reads a param that may arrive as a string, a repeated `string[]`, or a
 * comma-separated list.
 *
 * `queryToParams` writes multi-select groups as `a,b,c`, so values must be split
 * here too. Accepting all three shapes means a hand-written or legacy URL using
 * `?degree=masters&degree=phd` behaves identically to one we generated.
 */
function readParam(params: RawSearchParams, key: string): string[] {
  const value = params[key];
  if (value === undefined) return [];

  return (Array.isArray(value) ? value : [value])
    .filter((entry): entry is string => typeof entry === "string")
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Keeps only recognised values, so a hand-edited URL cannot widen the filter. */
function coerce<T extends string>(values: string[], allowed: readonly T[]): T[] {
  const permitted = new Set<string>(allowed);
  return [...new Set(values.filter((value) => permitted.has(value)))] as T[];
}

/** Parses GPA values, which are numeric rather than categorical. */
function coerceGpa(values: string[]): GpaRequirement[] {
  return coerce(
    values,
    GPA_LEVELS.map(String) as unknown as readonly string[],
  ).map(Number) as GpaRequirement[];
}

/** The neutral query: no filters, best match first. */
export const DEFAULT_QUERY: ExplorerQuery = {
  q: "",
  degree: [],
  fields: [],
  countries: [],
  funding: [],
  deadlines: [],
  gpa: [],
  language: [],
  sort: "best_match",
};

/** Builds an `ExplorerQuery` from URL search params, ignoring unknown values. */
export function parseQuery(params: RawSearchParams): ExplorerQuery {
  const rawSort = readParam(params, "sort")[0];
  const sort = SORT_KEYS.includes(rawSort as SortKey)
    ? (rawSort as SortKey)
    : DEFAULT_QUERY.sort;

  return {
    q: readParam(params, "q")[0]?.trim() ?? DEFAULT_QUERY.q,
    degree: coerce(readParam(params, "degree"), DEGREE_FILTERS),
    fields: normalise(readParam(params, "field")),
    countries: normalise(readParam(params, "country")),
    funding: coerce(readParam(params, "funding"), FUNDING_TIERS),
    deadlines: coerce(readParam(params, "deadline"), DEADLINE_WINDOWS),
    gpa: coerceGpa(readParam(params, "gpa")),
    language: coerce(readParam(params, "lang"), LANGUAGE_FILTERS),
    sort,
  };
}

/**
 * Lower-cases and de-duplicates the free-form filter tokens.
 *
 * Countries and fields are dataset values rather than a closed vocabulary, so
 * they cannot be validated against a fixed list. Normalising them means the
 * comparison can stay case-insensitive and a URL written by hand
 * (`?country=canada`) behaves the same as one the UI produced.
 */
function normalise(values: string[]): string[] {
  return [...new Set(values.map((value) => value.toLowerCase()))];
}

/** Serialises a query back to search params, omitting anything at its default. */
export function queryToParams(query: ExplorerQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort !== DEFAULT_QUERY.sort) params.set("sort", query.sort);
  if (query.degree.length) params.set("degree", query.degree.join(","));
  if (query.fields.length) params.set("field", query.fields.join(","));
  if (query.countries.length) params.set("country", query.countries.join(","));
  if (query.funding.length) params.set("funding", query.funding.join(","));
  if (query.deadlines.length) params.set("deadline", query.deadlines.join(","));
  if (query.gpa.length) params.set("gpa", query.gpa.join(","));
  if (query.language.length) params.set("lang", query.language.join(","));
  return params;
}

/** True when nothing beyond the default sort is applied. */
export function isDefaultQuery(query: ExplorerQuery): boolean {
  return (
    query.q === "" &&
    query.degree.length === 0 &&
    query.fields.length === 0 &&
    query.countries.length === 0 &&
    query.funding.length === 0 &&
    query.deadlines.length === 0 &&
    query.gpa.length === 0 &&
    query.language.length === 0
  );
}

/** Number of individual filter values applied, for the chip count badge. */
export function countActiveFilters(query: ExplorerQuery): number {
  return (
    query.degree.length +
    query.fields.length +
    query.countries.length +
    query.funding.length +
    query.deadlines.length +
    query.gpa.length +
    query.language.length
  );
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Which deadline bucket a record falls into, relative to the reference date.
 *
 * Returns `null` for a record with no single closing date: "closes in N days"
 * is not a question that can be answered about a rolling or not-yet-announced
 * deadline, so it belongs to no bucket rather than to the nearest-sounding one.
 */
export function deadlineWindow(deadline: string | null): DeadlineWindow | null {
  if (deadline === null) return null;
  const days = daysBetween(new Date(QUERY_REFERENCE_DATE), new Date(deadline));
  if (days <= 21) return "closing_soon";
  if (days <= 31) return "this_month";
  if (days <= 92) return "next_three_months";
  return "later";
}

/** Sort key for a closing date; records without one sort last. */
function deadlineSortValue(deadline: string | null): number {
  return deadline === null ? Number.POSITIVE_INFINITY : new Date(deadline).getTime();
}

/** Sort key for a publication date; records without one sort last. */
function postedSortValue(postedAt: string | null): number {
  return postedAt === null ? Number.NEGATIVE_INFINITY : new Date(postedAt).getTime();
}

/**
 * Orders two sort keys, treating equal sentinels as equal.
 *
 * `Infinity - Infinity` is `NaN`, which a sort comparator must not return, so
 * two records that both lack a date compare as tied instead of as broken.
 */
function compareKeys(a: number, b: number): number {
  return a === b ? 0 : a - b;
}

/** True when the record accepts a language test waiver instead of a test. */
function acceptsNoLanguageTest(scholarship: Scholarship): boolean {
  return scholarship.languageTests.length === 0;
}

/**
 * Free-text match across the fields a student would plausibly type.
 *
 * Every whitespace-separated term must appear somewhere, which makes
 * multi-word queries narrow the result set rather than widen it.
 */
function matchesText(scholarship: Scholarship, term: string): boolean {
  if (!term) return true;
  const haystack = [
    scholarship.title,
    scholarship.organization,
    scholarship.city,
    scholarship.country,
    scholarship.degreeLabel,
    scholarship.fundingLabel,
    ...scholarship.fields,
    ...scholarship.tags,
  ]
    .join(" ")
    .toLowerCase();

  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Applies every active filter, returning only the records that survive. */
export function filterScholarships(
  scholarships: readonly Scholarship[],
  query: ExplorerQuery,
): Scholarship[] {
  return scholarships.filter((scholarship) => {
    if (!matchesText(scholarship, query.q)) return false;

    if (query.degree.length) {
      const levels = scholarship.degreeLevels as readonly DegreeFilter[];
      if (!query.degree.some((level) => levels.includes(level))) return false;
    }

    if (query.fields.length) {
      const fields = scholarship.fields.map((field) => field.toLowerCase());
      if (!query.fields.some((field) => fields.includes(field.toLowerCase()))) return false;
    }

    if (query.countries.length) {
      // Both sides are lower-cased: the query carries normalised URL tokens and
      // the record carries the display name.
      const country = scholarship.country.toLowerCase();
      if (!query.countries.includes(country)) return false;
    }

    if (query.funding.length) {
      if (!query.funding.includes(scholarship.funding)) return false;
    }

    if (query.deadlines.length) {
      const window = deadlineWindow(scholarship.deadline);
      // A record with no exact date answers no deadline filter, however it is
      // worded — the filter is a question about timing this record cannot take.
      if (window === null || !query.deadlines.includes(window)) return false;
    }

    if (query.gpa.length) {
      // A record satisfies the group if it meets the *lowest* selected floor,
      // because every level above that floor also meets it. A record whose
      // provider states its own terms publishes no floor to compare, so it
      // cannot answer the filter and is left out while the filter is active.
      const floor = Math.min(...query.gpa);
      if (scholarship.gpa === null || scholarship.gpa > floor) return false;
    }

    if (query.language.length) {
      const tests = scholarship.languageTests as readonly LanguageTest[];

      // `"none"` matches records that list no test requirement, so it is
      // resolved against the record rather than compared like a test name.
      const matched = query.language.some((entry) =>
        entry === "none" ? acceptsNoLanguageTest(scholarship) : tests.includes(entry),
      );

      if (!matched) return false;
    }

    return true;
  });
}

/**
 * Resolves the engine output for a record.
 *
 * Sorting by match score needs the score, and since Phase 03 the score no longer
 * lives on the record. Rather than let this module import the engine, callers
 * pass a lookup. The explorer passes one backed by `activeDemoProfile`, so its
 * ordering and its cards are scored identically.
 */
export type MatchLookup = (scholarship: Scholarship) => MatchInsights;

/**
 * Orders results.
 *
 * `best_match` and `relevant` both follow the engine score, but differ in
 * intent: relevance additionally rewards a clean score with no open warnings,
 * which is the ordering a student browsing rather than searching wants.
 */
export function sortScholarships(
  scholarships: readonly Scholarship[],
  sort: SortKey,
  lookup: MatchLookup,
): Scholarship[] {
  const sorted = [...scholarships];

  switch (sort) {
    case "deadline_soon":
      return sorted.sort((a, b) =>
        compareKeys(deadlineSortValue(a.deadline), deadlineSortValue(b.deadline)),
      );

    case "newest":
      return sorted.sort((a, b) =>
        compareKeys(postedSortValue(b.postedAt), postedSortValue(a.postedAt)),
      );

    case "fully_funded":
      return sorted.sort((a, b) => {
        const rank = (record: Scholarship) => FUNDING_TIERS.indexOf(record.funding);
        const delta = rank(a) - rank(b);
        // Ties fall back to score so the ordering stays deterministic.
        return delta !== 0 ? delta : lookup(b).score - lookup(a).score;
      });

    case "relevant":
      return sorted.sort((a, b) => relevance(a, lookup) - relevance(b, lookup));

    case "best_match":
    default:
      return sorted.sort((a, b) => {
        const delta = lookup(b).score - lookup(a).score;
        return delta !== 0
          ? delta
          : compareKeys(deadlineSortValue(a.deadline), deadlineSortValue(b.deadline));
      });
  }
}

/** Higher is better: score, discounted for outstanding warnings. */
function relevance(scholarship: Scholarship, lookup: MatchLookup): number {
  return lookup(scholarship).score - lookup(scholarship).warnings.length * 4;
}

/** Filters then sorts, the single entry point the explorer page uses. */
export function runQuery(
  scholarships: readonly Scholarship[],
  query: ExplorerQuery,
  lookup: MatchLookup,
): Scholarship[] {
  return sortScholarships(filterScholarships(scholarships, query), query.sort, lookup);
}

/** True when a record advertises the no-language-test option. */
export function matchesLanguageWaiver(scholarship: Scholarship): boolean {
  return acceptsNoLanguageTest(scholarship);
}