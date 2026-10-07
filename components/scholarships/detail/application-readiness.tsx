"use client";

import { useMemo } from "react";

import { ReadinessView } from "@/components/scholarships/detail/readiness-view";
import { NeedsProfile, useMatchState } from "@/components/matches/personalised-match";
import { assessReadiness } from "@/lib/preparation";

import type { Scholarship } from "@/types/scholarship";

/**
 * Neutral block that matches the readiness layout's height so the swap from
 * sample to personalised cannot reflow. Exported because the prerendered
 * `?mine=1` detail page needs the same block in its own HTML.
 */
export function ReadinessPlaceholder() {
  return (
    <div className="space-y-5">
      <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
        <div aria-hidden="true" className="shimmer h-3 w-16 rounded-full" />
        <div aria-hidden="true" className="shimmer mt-4 h-12 w-28 rounded-full" />
        <div aria-hidden="true" className="shimmer mt-4 h-3 w-2/3 rounded-full" />
        <div aria-hidden="true" className="shimmer mt-3 h-3 w-1/2 rounded-full" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div aria-hidden="true" className="shimmer h-32 rounded-2xl" />
        <div aria-hidden="true" className="shimmer h-32 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * The "Application readiness" section.
 *
 * Like the match ring and breakdown, this section is personalised: for a bare
 * visit it renders the sample-context markup the server supplied (`fallback`),
 * and for `?mine=1` it swaps to a neutral placeholder until hydration computes
 * the visitor's own assessment from the engine result already in context.
 */
export function ApplicationReadiness({
  scholarship,
  fallback,
}: {
  scholarship: Scholarship;
  fallback: React.ReactNode;
}) {
  const state = useMatchState();

  const assessment = useMemo(
    () =>
      state.kind === "ready"
        ? assessReadiness(scholarship, state.profile, state.result)
        : null,
    [scholarship, state],
  );

  if (state.kind === "sample") return <>{fallback}</>;

  if (state.kind === "loading") {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Reading your saved profile
        </span>
        <ReadinessPlaceholder />
      </div>
    );
  }

  if (state.kind === "unreadable" || state.kind === "empty") {
    return <NeedsProfile unreadable={state.kind === "unreadable"} />;
  }

  return <ReadinessView assessment={assessment!} />;
}