"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";

import { NoSavedState } from "@/components/scholarships/empty-states";
import {
  SavedProvider,
  useSaved,
} from "@/components/scholarships/saved-provider";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { ScholarshipGridSkeleton } from "@/components/scholarships/scholarship-card-skeleton";
import { AmbientField } from "@/components/ui/ambient-field";
import { Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { activeDemoProfile } from "@/lib/demo/student-profiles";
import { matchScholarship, toMatchInsights } from "@/lib/matching";
import { allScholarships, toPreview } from "@/lib/scholarships";

/**
 * Saved-opportunities surface.
 *
 * A client island for the same reason `/matches` is: the saved set lives in
 * `localStorage`, which the server cannot read. The heading, disclosure and
 * loading state ship from the server; the list itself appears once the stored
 * ids have been read.
 *
 * Cards are scored against `activeDemoProfile`, exactly as the explorer does,
 * and link with a bare path, so a record reached from here keeps the sample
 * context its card was scored in.
 */
export function SavedView() {
  return (
    <SavedProvider>
      <SavedViewInner />
    </SavedProvider>
  );
}

function SavedViewInner() {
  const { saved, isHydrated, clear } = useSaved();

  const savedScholarships = useMemo(
    () => allScholarships().filter((scholarship) => saved.has(scholarship.id)),
    [saved],
  );

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-10 sm:pt-36 lg:pt-40">
        <AmbientField />
        <Container size="wide" className="relative">
          <Eyebrow>Saved</Eyebrow>
          <h1 className="mt-6 max-w-3xl font-display text-[2.25rem] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl lg:text-[3.75rem]">
            The shortlist you keep coming back to.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
            Every scholarship you marked for later, gathered in one place.
          </p>

          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-pretty text-mist-500">
            Saved items are stored in this browser only. Sample records are
            illustrative; sourced records reflect what the provider published when
            we last checked.
          </p>
        </Container>
      </section>

      <Container size="wide" className="pb-24">
        {!isHydrated ? (
          <div className="mt-10" aria-busy="true">
            <p aria-live="polite" className="text-sm text-mist-500">
              Reading your saved scholarships.
            </p>
            <div className="mt-6">
              <ScholarshipGridSkeleton count={3} />
            </div>
          </div>
        ) : savedScholarships.length === 0 ? (
          <div className="mt-10">
            <NoSavedState />
          </div>
        ) : (
          <>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-mist-400">
                {savedScholarships.length}{" "}
                {savedScholarships.length === 1 ? "scholarship" : "scholarships"}{" "}
                saved
              </p>

              <Button onClick={clear} variant="ghost" size="sm">
                <Trash2 className="size-4" aria-hidden="true" />
                Clear all
              </Button>
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {savedScholarships.map((scholarship, index) => (
                <li key={scholarship.id} className="h-full min-w-0">
                  <ScholarshipCard
                    scholarship={toPreview(
                      scholarship,
                      toMatchInsights(matchScholarship(activeDemoProfile, scholarship)),
                    )}
                    href={`/scholarships/${scholarship.id}`}
                    priority={index < 3}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </>
  );
}