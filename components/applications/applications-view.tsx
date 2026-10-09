"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Compass, Inbox, ListChecks } from "lucide-react";

import { ApplicationStatusControl } from "@/components/applications/application-status-control";
import { NextActionRow } from "@/components/applications/next-action-row";
import { useApplications } from "@/components/applications/use-applications";
import { useChecklist } from "@/components/scholarships/detail/readiness-tracker";
import { AmbientField } from "@/components/ui/ambient-field";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Container } from "@/components/ui/container";
import {
  NO_SCHOLARSHIP_PROGRESS,
  attentionRank,
  deadlineReport,
  needsAttention,
  nextAction,
  preparationProgress,
  sortTracked,
} from "@/lib/applications";
import { cn } from "@/lib/cn";
import { getScholarship } from "@/lib/scholarships";
import { APPLICATION_STATUS_LABEL, TERMINAL_STATUSES } from "@/types/application";

import type { DeadlineRead } from "@/lib/applications";
import type { TrackedRow } from "@/lib/applications";
import type { ChecklistRecords } from "@/lib/preparation/tracker";
import type { TrackedApplication } from "@/types/application";

/**
 * The application-tracking dashboard.
 *
 * One client island for the same reason `/matches` is: the tracked records
 * live in `localStorage`, which the server cannot read. The heading and the
 * disclosure are sent from the server so the route is meaningful and honest
 * before any JavaScript runs; the list, filters and controls appear only once
 * the stored records have been read, so none of the visitor's own data ever
 * ships in the server HTML.
 *
 * Nothing here scores anything. The rows order by attention rank (deadline
 * pressure first, awaiting-decision rows after), which is a read on urgency,
 * not on fit — match scores never appear on this surface.
 */

type FilterKey = "all" | "attention" | "preparing" | "ready" | "applied" | "under_review" | "completed";

const FILTERS: ReadonlyArray<readonly [FilterKey, string]> = [
  ["all", "All"],
  ["attention", "Needs attention"],
  ["preparing", "Preparing"],
  ["ready", "Ready"],
  ["applied", "Applied"],
  ["under_review", "Under review"],
  ["completed", "Completed"],
];

function matchesFilter(key: FilterKey, row: TrackedRow): boolean {
  switch (key) {
    case "all":
      return true;
    case "attention":
      return row.needsAttention;
    case "preparing":
      return row.tracked.status === "interested" || row.tracked.status === "preparing";
    case "ready":
      return row.tracked.status === "ready_to_apply";
    case "applied":
      return row.tracked.status === "applied";
    case "under_review":
      return row.tracked.status === "under_review" || row.tracked.status === "interview";
    case "completed":
      return TERMINAL_STATUSES.has(row.tracked.status);
  }
}

function buildRow(tracked: TrackedApplication, checklist: ChecklistRecords): TrackedRow {
  const scholarship = getScholarship(tracked.scholarshipId);

  if (!scholarship) {
    // Stale: the id is no longer in the collection. Keep the record intact so a
    // status change and removal still work, and never crash on an unknown id.
    const deadline: DeadlineRead = { state: "unknown", urgent: false, label: "No longer listed", note: null };
    const rank = attentionRank(tracked.status, deadline, NO_SCHOLARSHIP_PROGRESS);
    return { tracked, deadline, progress: NO_SCHOLARSHIP_PROGRESS, rank, needsAttention: needsAttention(rank) };
  }

  const deadline = deadlineReport(scholarship, tracked.status);
  const progress = preparationProgress(scholarship, checklist);
  const rank = attentionRank(tracked.status, deadline, progress);

  return {
    tracked,
    scholarship,
    deadline,
    progress,
    nextAction: nextAction({ scholarship, status: tracked.status, deadline, progress }),
    rank,
    needsAttention: needsAttention(rank),
  };
}

function deadlineTone(deadline: DeadlineRead): "caution" | "neutral" {
  return deadline.urgent ? "caution" : "neutral";
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(days / 365)} y ago`;
}

export function ApplicationsView() {
  const { records, isHydrated, untrack, setStatus, setNote } = useApplications();
  const { records: checklist } = useChecklist();
  const [filter, setFilter] = useState<FilterKey>("all");

  const rows = useMemo(() => sortTracked(Object.values(records.records).map((tracked) => buildRow(tracked, checklist))), [records, checklist]);

  const total = rows.length;
  const attentionCount = rows.filter((row) => row.needsAttention).length;
  const awaitingCount = rows.filter(
    (row) =>
      row.tracked.status === "applied" ||
      row.tracked.status === "under_review" ||
      row.tracked.status === "interview",
  ).length;

  const visible = filter === "all" ? rows : rows.filter((row) => matchesFilter(filter, row));

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-10 sm:pt-36 lg:pt-40">
        <AmbientField />
        <Container size="wide" className="relative">
          <Eyebrow>Your applications</Eyebrow>
          <h1 className="mt-6 max-w-3xl font-display text-[2.25rem] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl lg:text-[3.75rem]">
            Applications, tracked forward.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
            Where each application sits, what the deadline is doing, and the one
            next step worth taking — until a decision arrives.
          </p>

          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-pretty text-mist-500">
            Statuses, notes and preparation ticks are stored in this browser only.
            ScholarMatch never submits, scores or discloses an application on your
            behalf.
          </p>

          {isHydrated && total > 0 ? (
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">
                {total} tracked
              </Badge>
              {attentionCount > 0 ? (
                <Badge tone="caution">
                  {attentionCount} {attentionCount === 1 ? "needs" : "need"} attention
                </Badge>
              ) : null}
              {awaitingCount > 0 ? (
                <Badge tone="accent">
                  {awaitingCount} awaiting decision
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="mt-7">
            <Button href="/ai-assistant?from=applications" variant="secondary" size="sm">
              <Compass className="size-4" aria-hidden="true" />
              Ask the companion what to do next
            </Button>
          </div>
        </Container>
      </section>

      <Container size="wide" className="pb-24">
        {!isHydrated ? (
          <div className="mt-10">
            <p aria-live="polite" className="text-sm text-mist-500">
              Reading your saved applications.
            </p>
            <div className="mt-6 space-y-5">
              <ApplicationsSkeleton />
              <ApplicationsSkeleton />
            </div>
          </div>
        ) : total === 0 ? (
          <EmptyApplications />
        ) : (
          <>
            <div className="mt-10 flex flex-wrap items-center gap-2" role="group" aria-label="Filter tracked applications">
              {FILTERS.map(([key, label]) => {
                const active = filter === key;
                const count = key === "all" ? total : rows.filter((row) => matchesFilter(key, row)).length;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(key)}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[0.8125rem] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
                      active
                        ? "border-hairline-strong bg-tint/[0.09] text-mist-50"
                        : "border-hairline bg-tint/[0.03] text-mist-400 hover:border-hairline-strong hover:bg-tint/[0.06] hover:text-mist-100",
                    )}
                  >
                    {label}
                    <span className={cn("text-[0.6875rem]", active ? "text-azure-300" : "text-mist-500")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {attentionCount > 0 ? (
              <p className="mt-5 flex max-w-2xl gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3.5 text-sm leading-relaxed text-mist-300">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                <span>
                  {attentionCount} tracked {attentionCount === 1 ? "application" : "applications"} {attentionCount === 1 ? "needs" : "need"} attention —
                  a deadline is close or preparation is unfinished. They lead the list.
                </span>
              </p>
            ) : null}

            <h2 className="sr-only">Tracked applications</h2>

            {visible.length > 0 ? (
              <ul className="mt-8 space-y-5">
                {visible.map((row) => (
                  <li key={row.tracked.scholarshipId}>
                    <TrackedCard
                      row={row}
                      onStatus={(status) => setStatus(row.tracked.scholarshipId, status)}
                      onNote={(note) => setNote(row.tracked.scholarshipId, note)}
                      onUntrack={() => untrack(row.tracked.scholarshipId)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 rounded-3xl border border-hairline bg-tint/[0.02] p-10 text-center">
                <p className="text-sm text-mist-400">No applications in this group.</p>
              </div>
            )}

            <p className="mt-8 text-xs text-mist-500">
              Everything on this page is stored in this browser only. Clear it with
              your browser&apos;s site data.
            </p>
          </>
        )}
      </Container>
    </>
  );
}

function TrackedCard({
  row,
  onStatus,
  onNote,
  onUntrack,
}: {
  row: TrackedRow;
  onStatus: (status: TrackedApplication["status"]) => void;
  onNote: (note: string) => void;
  onUntrack: () => void;
}) {
  const { tracked, scholarship, deadline, progress, nextAction } = row;
  const noteId = `application-note-${tracked.scholarshipId}`;
  const detailUrl = scholarship ? `/scholarships/${scholarship.id}` : null;

  return (
    <article className="surface-glass edge-highlight rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {scholarship ? (
            <>
              <h3 className="text-base font-medium text-mist-50">
                <Link
                  href={detailUrl ?? "/scholarships"}
                  className="hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
                >
                  {scholarship.title}
                </Link>
              </h3>
              <p className="mt-1 text-xs text-mist-500">
                {scholarship.organization} &middot; {scholarship.country} &middot; {scholarship.degreeLabel}
              </p>
            </>
          ) : (
            <>
              <h3 className="text-base font-medium text-mist-50">Unlisted scholarship</h3>
              <p className="mt-1 text-xs text-mist-500">
                This record is no longer listed in the collection. Its status is kept
                so you can still see where it stood.
              </p>
            </>
          )}
        </div>

        <span className="text-xs text-mist-500">{timeAgo(tracked.updatedAt)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ApplicationStatusControl value={tracked.status} onChange={onStatus} />

        <Badge tone={deadlineTone(deadline)} icon={<CalendarClock className="size-3.5" aria-hidden="true" />}>
          {deadline.label}
        </Badge>
      </div>

      {scholarship ? (
        <div className="mt-4 space-y-3">
          <p className="flex items-center gap-1.5 text-xs text-mist-400">
            <ListChecks className="size-3.5 shrink-0 text-mist-500" aria-hidden="true" />
            {progress.marked} of {progress.total} prepared
            <span className="text-mist-500">({progress.percent}%)</span>
          </p>

          {nextAction ? <NextActionRow action={nextAction} /> : null}
        </div>
      ) : null}

      <div className="mt-4">
        <label htmlFor={noteId} className="text-xs text-mist-400">
          Private note
        </label>
        <input
          id={noteId}
          type="text"
          defaultValue={tracked.note ?? ""}
          onBlur={(event) => onNote(event.target.value.trim())}
          placeholder="Anything to remember about this application"
          autoComplete="off"
          className="mt-1.5 w-full rounded-xl border border-hairline bg-tint/[0.03] px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-500 transition-colors duration-200 hover:border-hairline-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <span className="text-xs text-mist-500">
          {APPLICATION_STATUS_LABEL[tracked.status]} &middot; saved in this browser only
        </span>

        <ConfirmAction
          label="Stop tracking"
          question="Remove this scholarship from your tracked applications? Its status and note are stored in this browser only and will be deleted."
          onConfirm={onUntrack}
          variant="ghost"
          size="sm"
        />
      </div>
    </article>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="surface-glass edge-highlight rounded-3xl p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full max-w-sm">
          <div aria-hidden="true" className="shimmer h-4 w-2/3 rounded-full" />
          <div aria-hidden="true" className="shimmer mt-2 h-3 w-1/3 rounded-full" />
        </div>
        <div aria-hidden="true" className="shimmer h-3 w-16 rounded-full" />
      </div>
      <div aria-hidden="true" className="shimmer mt-5 h-4 w-24 rounded-full" />
      <div aria-hidden="true" className="shimmer mt-4 h-14 rounded-xl" />
      <div aria-hidden="true" className="shimmer mt-4 h-10 rounded-xl" />
    </div>
  );
}

function EmptyApplications() {
  return (
    <div className="surface-glass edge-highlight relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-azure-400/10 blur-3xl"
      />

      <div className="relative">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-hairline bg-tint/[0.04]">
          <Inbox className="size-6 text-mist-400" aria-hidden="true" />
        </span>

        <h2 className="mt-6 font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl">
          Nothing tracked yet
        </h2>

        <p className="mx-auto mt-3 max-w-md text-pretty text-mist-400">
          Open a scholarship you want to apply to and start tracking it there, or
          browse the collection and pick what to follow. Statuses, notes and
          preparation ticks stay in this browser only.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/scholarships">Browse scholarships</Button>
          <Button href="/matches" variant="secondary">
            See my matches
          </Button>
        </div>
      </div>
    </div>
  );
}