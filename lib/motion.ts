"use client";

import { useEffect, useRef, useState } from "react";

/** Options controlling how an element is observed. */
interface UseInViewOptions {
  /** Fire as soon as this fraction of the element is visible. */
  threshold?: number;
  /** Root margin, useful for triggering slightly before entry. */
  rootMargin?: string;
  /** Stop observing after the first intersection. Defaults to true. */
  once?: boolean;
}

/**
 * Reports whether an element has entered the viewport.
 *
 * Built on IntersectionObserver so the work happens off the main thread and
 * costs nothing while the element is off-screen.
 *
 * `prefers-reduced-motion` is deliberately not consulted here: the stylesheet
 * already neutralises transitions and forces revealed states, so the component
 * tree stays identical for every user and no extra render is required.
 */
export function useInView<T extends Element>({
  threshold = 0.2,
  rootMargin = "0px 0px -10% 0px",
  once = true,
}: UseInViewOptions = {}): {
  ref: React.RefObject<T | null>;
  inView: boolean;
} {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Without observer support, reveal on the next frame rather than
    // synchronously inside the effect body.
    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setInView(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

/**
 * Tracks whether the user has scrolled the page past a threshold.
 *
 * Used by the header to condense its chrome. Renders synchronously from the
 * existing scroll position on mount so the header never flashes.
 */
export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > threshold);
    };

    const onScroll = () => {
      // Coalesce scroll events into a single read per animation frame.
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return scrolled;
}