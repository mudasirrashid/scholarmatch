"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Applies scroll-linked parallax to its descendants.
 *
 * Any descendant carrying `data-parallax-speed` is translated vertically in
 * proportion to the group's position in the viewport. Transforms are written
 * straight to the DOM inside a single `requestAnimationFrame` callback, so
 * scrolling causes no React re-render and no layout work.
 *
 * Keep parallax layers as wrappers around animated elements rather than the
 * same element — a CSS animation owns `transform` while it runs and would
 * otherwise mask the parallax offset.
 */
export function ParallaxGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = groupRef.current;
    if (!root) return;

    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const layers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-parallax-speed]"),
    );
    if (layers.length === 0) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const rect = root.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;

      // Normalised -1 (below viewport) .. 1 (above viewport).
      const centreOffset =
        (rect.top + rect.height / 2 - viewportHeight / 2) / (viewportHeight / 2);

      for (const layer of layers) {
        const speed = Number.parseFloat(layer.dataset.parallaxSpeed ?? "0");
        if (!speed) continue;
        const offset = Math.max(-1, Math.min(1, centreOffset)) * speed;
        layer.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={groupRef} className={cn(className)}>
      {children}
    </div>
  );
}