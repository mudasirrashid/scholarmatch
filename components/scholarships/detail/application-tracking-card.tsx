"use client";

import Link from "next/link";
import { CalendarClock, ListChecks } from "lucide-react";

import { ApplicationStatusControl } from "@/components/applications/application-status-control";
import { NextActionRow } from "@/components/applications/next-action-row";
import { useApplications } from "@/components/applications/use-applications";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  applicationByScholarship,
  deadlineReport,
  nextAction,
  preparationProgress,
} from "@/lib/applications";
import { useChecklist } from "@/components/scholarships/detail/readiness-tracker";

import type { Scholarship } from "@/types/scholarship";

/**
 * Track-an-application card on the scholarship detail page.
 *
 * Sits in the "Application readiness" section, next to the readiness figure
 * and the preparation tracker, and is deliberately a separate idea from both:
 * readiness is what the profile evidences and the tracker records preparation
 * ticks, while this card records where the application itself sits. Its state
 * lives in `localStorage` (read through the same external-store hook the
 * dashboard uses), so the server markup is only a skeleton and neither a
 * status nor a note ever ships in the HTML.
 *
 * The next step shown here is the same engine the dashboard uses, so the two
 * surfaces always advise the same thing.
 */
export function ApplicationTrackingCard({ scholarship }: { scholarship: Scholarship }) {
  const { records, isHydrated, track, untrack, setStatus, setNote } = useApplications();
  const { records: checklist } = useChecklist();

  if (!isHydrated) {
    return (
      <div aria-busy="true" className="mt-8">
        <span className="sr-only" role="status">
          Reading your saved applications
        </span>
        <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
          <div aria-hidden="true" className="shimmer h-4 w-40 rounded-full" />
          <div aria-hidden="true" className="shimmer mt-4 h-12 rounded-xl" />
          <div aria-hidden="true" className="shimmer mt-2 h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  const tracked = applicationByScholarship(records, scholarship.id);

  if (!tracked) {
    return (
      <section className="mt-8" aria-label="Your application">
        <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-mist-50">Your application</h3>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-mist-300">
            Follow this scholarship from interested to decision. Where it sits,
            what the deadline is doing and the next step worth taking are saved in
            this browser only — they never change the readiness figure above.
          </p>
          <Button onClick={() => track(scholarship.id)} variant="accent" size="sm" className="mt-5">
            Track this application
          </Button>
        </div>
      </section>
    );
  }

  const deadline = deadlineReport(scholarship, tracked.status);
  const progress = preparationProgress(scholarship, checklist);
  const action = nextAction({ scholarship, status: tracked.status, deadline, progress });
  const noteId = `application-note-${scholarship.id}`;

  return (
    <section className="mt-8" aria-label="Your application">
      <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-mist-50">
              Your application
              <span className="rounded-full border border-azure-400/30 bg-azure-400/10 px-2.5 py-0.5 text-xs font-medium text-azure-200">
                Tracking
              </span>
            </h3>
            <p className="mt-1 text-xs text-mist-500">
              Saved in this browser only.
            </p>
          </div>

          <Button href="/applications" variant="ghost" size="sm">
            Open application tracker
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ApplicationStatusControl value={tracked.status} onChange={(status) => setStatus(scholarship.id, status)} />

          <Badge tone={deadline.urgent ? "caution" : "neutral"} icon={<CalendarClock className="size-3.5" aria-hidden="true" />}>
            {deadline.label}
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          <p className="flex items-center gap-1.5 text-xs text-mist-400">
            <ListChecks className="size-3.5 shrink-0 text-mist-500" aria-hidden="true" />
            {progress.marked} of {progress.total} prepared
            <span className="text-mist-500">({progress.percent}%)</span>
          </p>

          <NextActionRow action={action} />
        </div>

        <div className="mt-4">
          <label htmlFor={noteId} className="text-xs text-mist-400">
            Private note
          </label>
          <input
            id={noteId}
            type="text"
            defaultValue={tracked.note ?? ""}
            onBlur={(event) => setNote(scholarship.id, event.target.value.trim())}
            placeholder="Anything to remember about this application"
            autoComplete="off"
            className={cn(
              "mt-1.5 w-full rounded-xl border border-hairline bg-white/[0.03] px-3.5 py-2.5",
              "text-sm text-mist-100 placeholder:text-mist-500 transition-colors duration-200",
              "hover:border-hairline-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
            )}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
          <span className="text-xs text-mist-500">
            <Link
              href="/applications"
              className="text-mist-300 underline decoration-white/15 underline-offset-4 transition-colors duration-200 hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-azure-300"
            >
              Manage in your tracker
            </Link>
          </span>

          <ConfirmAction
            label="Stop tracking"
            question="Remove this scholarship from your tracked applications? Its status and note are stored in this browser only and will be deleted."
            onConfirm={() => untrack(scholarship.id)}
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </section>
  );
}