"use client";

import type { ElementType, ReactNode } from "react";

import type { CSSVars } from "@/lib/css";
import { useInView } from "@/lib/motion";

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "none";

const DIRECTION_SHIFT: Record<RevealDirection, CSSVars> = {
  up: { "--reveal-shift-y": "1.5rem" },
  down: { "--reveal-shift-y": "-1.5rem" },
  left: { "--reveal-shift-x": "-1.75rem", "--reveal-shift-y": "0rem" },
  right: { "--reveal-shift-x": "1.75rem", "--reveal-shift-y": "0rem" },
  scale: { "--reveal-scale": "0.96", "--reveal-shift-y": "0rem" },
  none: { "--reveal-shift-y": "0rem", "--reveal-scale": "1" },
};

export interface RevealProps {
  children: ReactNode;
  /** Element to render. Defaults to `div`. */
  as?: ElementType;
  /** Travel direction of the entrance. Defaults to `up`. */
  direction?: RevealDirection;
  /** Stagger offset in milliseconds. */
  delay?: number;
  /** Override the default 760ms transition. */
  duration?: number;
  className?: string;
  style?: CSSVars;
}

/**
 * Reveals its children once they enter the viewport.
 *
 * Only the wrapper is a client component; `children` are passed through from
 * server components and remain server-rendered. The hidden state lives in CSS
 * behind a `.js` class, so content stays visible if JavaScript never runs.
 */
export function Reveal({
  children,
  as: Tag = "div",
  direction = "up",
  delay = 0,
  duration,
  className,
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-revealed={inView ? "true" : "false"}
      className={className}
      style={{
        ...DIRECTION_SHIFT[direction],
        ...(delay ? { "--reveal-delay": `${delay}ms` } : null),
        ...(duration ? { "--reveal-duration": `${duration}ms` } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Reveals a list of items with an incremental stagger.
 *
 * Kept as a separate primitive because the delay ramp is a design decision in
 * its own right rather than something each call site should re-derive.
 *
 * `as` and `itemAs` exist so the group can emit valid list markup — a `div`
 * wrapper inside an `ol` would be invalid HTML.
 */
export function RevealGroup({
  children,
  className,
  itemClassName,
  /** Delay applied to the first item, in milliseconds. */
  baseDelay = 0,
  /** Additional delay added per index, in milliseconds. */
  step = 90,
  as: Tag = "div",
  itemAs: ItemTag = "div",
}: {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  baseDelay?: number;
  step?: number;
  as?: ElementType;
  itemAs?: ElementType;
}) {
  return (
    <Tag className={className}>
      {children.map((child, index) => (
        <Reveal
          key={index}
          as={ItemTag}
          className={itemClassName}
          delay={baseDelay + index * step}
        >
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}