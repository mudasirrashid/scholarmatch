import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";

/**
 * Vertical rhythm for every page section.
 *
 * Centralising the scale here means spacing stays consistent as the page grows
 * and later phases inherit the same rhythm for free.
 */
export function Section({
  children,
  id,
  className,
  tone = "default",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  /** `default` sits on the page colour; `raised` adds a subtle inset plane. */
  tone?: "default" | "raised";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 py-20 sm:py-28 lg:py-36",
        tone === "raised" && "bg-ink-925",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Consistent section header: eyebrow, display heading, supporting copy.
 *
 * The heading renders as `h2` by default so the page keeps a single `h1`
 * owned by the hero.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  size = "default",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  size?: "default" | "large";
  className?: string;
  children?: ReactNode;
}) {
  const headingSize =
    size === "large"
      ? "text-[2.5rem] leading-[1.06] sm:text-6xl lg:text-[4.25rem]"
      : "text-[2rem] leading-[1.1] sm:text-[2.75rem] lg:text-[3.5rem]";

  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? (
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}

      <Reveal delay={eyebrow ? 80 : 0}>
        <h2
          className={cn(
            "mt-6 font-display font-normal tracking-[-0.015em] text-balance text-mist-50",
            headingSize,
          )}
        >
          {title}
        </h2>
      </Reveal>

      {description ? (
        <Reveal delay={160}>
          <p
            className={cn(
              "mt-6 text-lg leading-relaxed text-pretty text-mist-400",
              align === "center" ? "max-w-2xl" : "max-w-xl",
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}

      {children}
    </div>
  );
}

/** Convenience wrapper that pairs a `Section` with a centred container. */
export function SectionShell({
  children,
  id,
  className,
  containerSize = "default",
  tone,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  containerSize?: "default" | "narrow" | "wide";
  tone?: "default" | "raised";
}) {
  return (
    <Section id={id} className={className} tone={tone}>
      <Container size={containerSize}>{children}</Container>
    </Section>
  );
}