import { cn } from "@/lib/cn";
import type { EligibilityStatus } from "@/types/scholarship";

/**
 * Static score bar for one match dimension.
 *
 * Deliberately a server component: the values are authored rather than measured,
 * so animating them would add a client island per row and read as motion noise
 * on a page that already has a hero ring.
 */
export function StatusBar({
  label,
  value,
  status,
}: {
  /** Dimension name, used as the accessible name. */
  label: string;
  /** Normalised score from 0 to 100. */
  value: number;
  status: EligibilityStatus;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const isPerfect = clamped >= 100;

  return (
    <div
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} match`}
      className="h-1.5 w-full overflow-hidden rounded-full bg-tint/[0.07]"
    >
      <div
        style={{ width: `${clamped}%` }}
        className={cn(
          "h-full rounded-full",
          isPerfect
            ? "bg-gradient-to-r from-mint-400 to-mint-300"
            : status === "review" || status === "not_eligible"
              ? "bg-gradient-to-r from-amber-500 to-amber-300"
              : "bg-gradient-to-r from-azure-500 to-iris-400",
        )}
      />
    </div>
  );
}