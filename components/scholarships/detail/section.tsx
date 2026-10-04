import { cn } from "@/lib/cn";

/**
 * A titled section of the detail page.
 *
 * Sections are real landmarks with stable ids so the sticky navigation can deep
 * link into them, and so a skip link can jump past the hero.
 */
export function DetailSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  /** Short framing sentence rendered under the heading. */
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-28 py-10 lg:py-14", className)}
    >
      <div className="max-w-2xl">
        <h2
          id={headingId}
          className="font-display text-2xl font-normal tracking-[-0.015em] text-mist-50 sm:text-3xl"
        >
          {title}
        </h2>

        {description ? (
          <p className="mt-3 text-pretty text-mist-400">{description}</p>
        ) : null}
      </div>

      <div className="mt-8">{children}</div>
    </section>
  );
}