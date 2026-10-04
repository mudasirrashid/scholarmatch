import type { CSSProperties } from "react";

/**
 * `CSSProperties` widened to accept CSS custom properties.
 *
 * React's built-in style type rejects `--*` keys, but custom properties are
 * how the design system passes per-instance values (reveal offsets, meter
 * delays, ring targets) into stylesheet rules.
 */
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;