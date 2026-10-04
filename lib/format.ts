/** Presentation helpers shared across scholarship surfaces. */

/**
 * Formats a remaining-days count as a short, human deadline label.
 *
 * `deadlineInDays` is whole days remaining, so anything at or below zero is
 * treated as closed rather than rendered as a negative countdown.
 */
export function formatDeadline(days: number): string {
  if (days <= 0) return "Closed";
  if (days === 1) return "1 day left";
  if (days < 31) return `${days} days left`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"} left`;
  }
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} left`;
}

/**
 * Formats an ISO date for display, e.g. "15 Nov 2026".
 *
 * Parsed manually rather than through `Date` formatting so the output does not
 * shift with the server's locale or time zone, which would make a
 * server-rendered card differ from the hydrated one.
 */
export function formatExactDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [, year, month, day] = match;
  const monthLabel = months[Number(month) - 1];

  return monthLabel ? `${Number(day)} ${monthLabel} ${year}` : iso;
}

/** True when the closing date is close enough to warrant a caution tone. */
export function isUrgent(days: number): boolean {
  return days > 0 && days <= 21;
}

/** Maps a 0-100 match score to the token used for its accent treatment. */
export function matchTone(score: number): "positive" | "accent" | "caution" {
  if (score >= 85) return "positive";
  if (score >= 65) return "accent";
  return "caution";
}