import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Page gutters plus a max content width, shared by every section. */
export function Container({
  children,
  className,
  as: Tag = "div",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** `narrow` is reserved for long-form reading measures. */
  size?: "default" | "narrow" | "wide";
}) {
  const width =
    size === "narrow"
      ? "max-w-3xl"
      : size === "wide"
        ? "max-w-7xl"
        : "max-w-6xl";

  /*
    `min-w-0` lets the box shrink inside a flex or grid parent, so a wide
    descendant cannot push the gutter off-screen on a narrow viewport.

    Deliberately no `max-w-full` here: `cn` is a plain join rather than a
    tailwind-merge, so it would end up in the class list beside the `size`
    prop's `max-w-*` and win on stylesheet order — silently deleting the
    desktop max-width and letting every container run edge to edge.
    `clip` on `html`/`body` remains the overflow backstop.
  */
  return (
    <Tag className={cn("mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-10", width, className)}>
      {children}
    </Tag>
  );
}