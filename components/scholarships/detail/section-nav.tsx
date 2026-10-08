"use client";

import { useEffect, useState } from "react";

/**
 * Sticky, scroll-aware section navigation.
 *
 * A plain anchor list would work without JavaScript, so it is rendered as
 * real links and progressively enhanced: `aria-current` tracks the section in
 * view via IntersectionObserver, and the active pill is only announced once
 * hydration has happened.
 *
 * `IntersectionObserver` is used rather than a scroll listener so the work runs
 * off the main thread.
 */
export function DetailSectionNav({ sections }: { sections: readonly { id: string; label: string }[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // Very short viewports cannot show the sticky bar and the section headings
    // at the same time, and the nav would obscure the content it points at.
    if (window.matchMedia("(max-height: 480px)").matches) return;

    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);

    if (headings.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }

        // Highlight the first visible section in document order, so scrolling up
        // moves the highlight rather than flickering between two entries.
        const first = sections.find((section) => visible.has(section.id));
        if (first) setActiveId(first.id);
      },
      // A band near the top of the viewport, below the sticky header.
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    for (const heading of headings) observer.observe(heading);

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Sections on this page" className="lg:sticky lg:top-28">
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {sections.map((section) => {
          const isActive = activeId === section.id;

          return (
            <li key={section.id} className="shrink-0 lg:shrink">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
                className={[
                  "inline-flex items-center rounded-full px-3.5 py-2 text-sm whitespace-nowrap",
                  "transition-[background-color,color] duration-[240ms]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
                  isActive
                    ? "bg-tint/[0.08] text-mist-50"
                    : "text-mist-500 hover:bg-tint/[0.05] hover:text-mist-200",
                ].join(" ")}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}