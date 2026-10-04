"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Final value. */
  value: number;
  /** Start the animation once the element is visible. Defaults to true. */
  animateOnView?: boolean;
  /** Total animation length in milliseconds. */
  duration?: number;
  /** Decimal places to render. Defaults to 0. */
  decimals?: number;
  className?: string;
}

const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animates a number from zero to `value`.
 *
 * Respects `prefers-reduced-motion` by rendering the final value immediately.
 * The render loop is driven by `requestAnimationFrame` and always cancels its
 * own frame on unmount.
 */
export function CountUp({
  value,
  animateOnView = true,
  duration = 1400,
  decimals = 0,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const [active, setActive] = useState(!animateOnView);

  /** Observed element, used only to decide when the animation starts. */
  const elementRef = useRef<HTMLSpanElement>(null);
  /** Pending animation frame id, so it can be cancelled on unmount. */
  const frameRef = useRef(0);

  useEffect(() => {
    // When the caller opts out of view-triggered animation, `active` is
    // already true from its initial state, so there is nothing to do here.
    if (!animateOnView) return;

    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setActive(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [animateOnView]);

  useEffect(() => {
    if (!active) return;

    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;

      // Reduced motion resolves to the final value on the first frame, which
      // keeps a single code path and avoids a synchronous state update.
      if (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setDisplay(value);
        return;
      }

      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(value * easeOutExpo(progress));

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(step);
      }
    };

    frameRef.current = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frameRef.current);
  }, [active, value, duration]);

  const formatted = display.toFixed(decimals);

  return (
    <span ref={elementRef} className={className}>
      {formatted}
    </span>
  );
}