"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * One filter option in the panel.
 *
 * A real checkbox rather than a styled `div`, so it is reachable by keyboard,
 * announced by screen readers and toggled by Space without any extra handlers.
 * The label covers the whole row, which gives a generous hit target.
 */
export function FilterCheckbox({
  label,
  hint,
  checked,
  onChange,
  name,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}) {
  return (
    <label
      className={cn(
        "group/check flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2",
        "transition-colors duration-200 hover:bg-tint/[0.05]",
        "focus-within:bg-tint/[0.05]",
      )}
    >
      <span className="relative grid size-[1.125rem] shrink-0 place-items-center">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-[0.3125rem] border border-hairline-strong bg-tint/[0.04] transition-[background-color,border-color] duration-200 checked:border-azure-400 checked:bg-azure-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
        />
        <svg
          className="pointer-events-none relative size-3 scale-75 text-ink-950 opacity-0 transition-[transform,opacity] duration-200 peer-checked:scale-100 peer-checked:opacity-100"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 6.2L4.8 8.5L9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-sm transition-colors duration-200",
            checked ? "text-mist-100" : "text-mist-400 group-hover/check:text-mist-200",
          )}
        >
          {label}
        </span>
        {hint ? <span className="label-micro shrink-0 text-mist-600">{hint}</span> : null}
      </span>
    </label>
  );
}

/**
 * Collapsible filter group.
 *
 * `details`/`summary` gives correct expanded state, keyboard support and
 * find-in-page behaviour for free, which a JS disclosure would have to
 * reimplement.
 */
export function FilterGroup({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  /** Number of active values, shown as a badge. */
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group/filter border-b border-hairline-soft py-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-1 text-sm font-medium text-mist-200 transition-colors duration-200 hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {title}
          {count > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-azure-400/15 font-mono text-[0.625rem] text-azure-200">
              {count}
            </span>
          ) : null}
        </span>

        <svg
          className="size-3.5 shrink-0 text-mist-500 transition-transform duration-300 group-open/filter:rotate-180"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <div className="mt-2 space-y-0.5">{children}</div>
    </details>
  );
}