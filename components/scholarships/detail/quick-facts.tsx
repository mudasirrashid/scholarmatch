import { Banknote, Clock, GraduationCap, MapPin, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { daysUntil } from "@/lib/scholarships";
import { formatDeadline, formatExactDate, isUrgent } from "@/lib/format";
import type { Scholarship } from "@/types/scholarship";

/**
 * A labelled fact.
 *
 * Rendered as a `dl` so the term/value relationship is exposed to assistive
 * technology rather than relying on visual adjacency.
 */
function Fact({
  icon: Icon,
  term,
  children,
  tone,
}: {
  icon: typeof Clock;
  term: string;
  children: React.ReactNode;
  tone?: "caution";
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-mist-500" aria-hidden="true">
        <Icon className="size-4" />
      </span>

      <div className="min-w-0">
        <dt className="text-xs text-mist-500">{term}</dt>
        <dd className={tone === "caution" ? "mt-0.5 text-sm text-amber-300" : "mt-0.5 text-sm text-mist-100"}>
          {children}
        </dd>
      </div>
    </div>
  );
}

/** The scannable summary block beside the match ring. */
export function QuickFacts({ scholarship }: { scholarship: Scholarship }) {
  const days = daysUntil(scholarship.deadline);
  const urgent = isUrgent(days);

  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <Fact icon={MapPin} term="Location">
        {scholarship.city}, {scholarship.country}
      </Fact>

      <Fact icon={GraduationCap} term="Degree level">
        {scholarship.degreeLabel}
        {scholarship.degreeLevels.length > 1 ? (
          <span className="text-mist-500">
            {" "}
            &middot; also open to {scholarship.degreeLevels.filter((l) => l !== scholarship.degree).length} other level
            {scholarship.degreeLevels.filter((l) => l !== scholarship.degree).length === 1 ? "" : "s"}
          </span>
        ) : null}
      </Fact>

      <Fact icon={Banknote} term="Funding">
        {scholarship.fundingLabel}
      </Fact>

      <Fact icon={Clock} term="Closes" tone={urgent ? "caution" : undefined}>
        <time dateTime={scholarship.deadline}>
          {formatExactDate(scholarship.deadline)}
        </time>
        <span className="text-mist-500"> &middot; {formatDeadline(days)}</span>
      </Fact>

      <Fact icon={Wallet} term="Application fee">
        {scholarship.applicationFee}
      </Fact>

      <Fact icon={GraduationCap} term="Duration">
        {scholarship.duration}
      </Fact>

      <div className="col-span-full flex flex-wrap gap-1.5">
        {scholarship.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </dl>
  );
}