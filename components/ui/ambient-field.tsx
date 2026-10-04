import { cn } from "@/lib/cn";

/**
 * Ambient light field placed behind hero and closing sections.
 *
 * Purely decorative and therefore hidden from assistive technology. All motion
 * is CSS-driven so it costs no JavaScript, and the global reduced-motion query
 * freezes it.
 */
export function AmbientField({
  className,
  intensity = "default",
}: {
  className?: string;
  intensity?: "subtle" | "default";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Primary aurora field, drifting on a long cycle. */}
      <div
        className={cn(
          "ambient-field absolute -inset-x-1/4 -top-[30%] h-[150%] animate-drift",
          intensity === "subtle" ? "opacity-45" : "opacity-70",
        )}
      />

      {/* Technical grid, masked so it never competes with content. */}
      <div className="ambient-grid absolute inset-0 opacity-60" />

      {/* Single bright source behind the hero copy for focal contrast. */}
      <div className="absolute left-1/2 top-[-14rem] h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(125,211,252,0.16),transparent)] blur-2xl" />

      {/* Seats the composition and removes the hard section boundary. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-950" />
    </div>
  );
}