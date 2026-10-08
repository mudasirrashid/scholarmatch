import { cn } from "@/lib/cn";

/**
 * Card-shaped loading placeholder.
 *
 * Mirrors the real card's geometry and uses the same surfaces, so a future
 * `loading.tsx` transitions into real cards without a layout shift. The shimmer
 * is disabled under reduced motion by the global stylesheet.
 */
export function ScholarshipCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "surface-glass relative flex h-full flex-col overflow-hidden rounded-3xl p-6",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="shimmer h-3 w-1/3 rounded-full" />
          <div className="shimmer h-5 w-4/5 rounded-md" />
          <div className="shimmer h-3 w-1/4 rounded-full" />
        </div>

        <div className="shrink-0 space-y-1.5 text-right">
          <div className="shimmer ml-auto h-8 w-14 rounded-md" />
          <div className="shimmer ml-auto h-2.5 w-10 rounded-full" />
        </div>
      </div>

      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-tint/[0.07]">
        <div className="shimmer h-full w-3/5 rounded-full" />
      </div>

      <div className="mt-5 flex gap-1.5">
        <div className="shimmer h-6 w-24 rounded-full" />
        <div className="shimmer h-6 w-16 rounded-full" />
      </div>

      <div className="mt-3 space-y-2">
        <div className="shimmer h-2.5 w-2/5 rounded-full" />
        <div className="shimmer h-2.5 w-1/3 rounded-full" />
      </div>

      <div className="mt-auto pt-6">
        <div className="rule-fade" />
        <div className="mt-4 flex items-center justify-between">
          <div className="shimmer h-4 w-20 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="shimmer h-4 w-24 rounded-full" />
            <div className="shimmer size-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeletons for the explorer route.
 *
 * `aria-busy` plus a visually hidden status announces the load to assistive
 * technology, since the skeletons themselves are hidden from it.
 */
export function ScholarshipGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Loading scholarships
      </span>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <ScholarshipCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}