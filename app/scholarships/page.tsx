import type { Metadata } from "next";
import { Suspense } from "react";

import { ExplorerShell } from "@/components/scholarships/explorer-shell";
import { NoResultsStateClient } from "@/components/scholarships/no-results-state-client";
import { SavedProvider } from "@/components/scholarships/saved-provider";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { ScholarshipGridSkeleton } from "@/components/scholarships/scholarship-card-skeleton";
import { AmbientField } from "@/components/ui/ambient-field";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/badge";
import {
  availableCountries,
  availableFields,
  allScholarships,
  toPreview,
} from "@/lib/scholarships";
import { parseQuery, runQuery, type RawSearchParams } from "@/lib/scholarships/query";

const DESCRIPTION =
  "Search and filter scholarship opportunities by degree, field, country and funding. Every entry shows its match strength and the requirements you still need to meet.";

export const metadata: Metadata = {
  title: "Scholarships worth applying for",
  description: DESCRIPTION,
  alternates: { canonical: "/scholarships" },
  openGraph: {
    title: "Scholarships worth applying for",
    description: DESCRIPTION,
    url: "/scholarships",
  },
};

/**
 * Explorer page.
 *
 * Filtering happens on the server from the URL, so the full result set is
 * present in the initial HTML: the page is usable and indexable before any
 * JavaScript executes, and a shared URL always reproduces the same view.
 */
export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const query = parseQuery(params);

  const all = allScholarships();
  const results = runQuery(all, query);

  const fields = availableFields();
  const countries = availableCountries();

  return (
    <>
      {/* Page header */}
      <section className="relative isolate overflow-hidden pt-32 pb-10 sm:pt-36 lg:pt-40">
        <AmbientField />
        <Container size="wide" className="relative">
          <Eyebrow>Explore opportunities</Eyebrow>
          <h1 className="mt-6 max-w-3xl font-display text-[2.25rem] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl lg:text-[3.75rem]">
            Find scholarships worth applying for.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
            Discover opportunities matched to your goals, eligibility and ambitions.
          </p>
        </Container>
      </section>

      <SavedProvider>
        <ExplorerShell
          query={query}
          fields={fields}
          countries={countries}
          resultCount={results.length}
          totalCount={all.length}
        >
          <Suspense fallback={<ScholarshipGridSkeleton />}>
            {results.length > 0 ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((scholarship, index) => (
                  <li key={scholarship.id} className="h-full min-w-0">
                    <ScholarshipCard
                      scholarship={toPreview(scholarship)}
                      href={`/scholarships/${scholarship.id}`}
                      priority={index < 3}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <NoResultsStateClient query={query} />
            )}
          </Suspense>
        </ExplorerShell>
      </SavedProvider>
    </>
  );
}