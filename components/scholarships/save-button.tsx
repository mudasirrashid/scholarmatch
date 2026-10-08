"use client";

import { Bookmark } from "lucide-react";

import { useSaved } from "@/components/scholarships/saved-provider";
import { cn } from "@/lib/cn";

/**
 * Save/unsave control for an opportunity.
 *
 * Rendered as a real `<button>` with `aria-pressed` so assistive technology
 * reports the saved state rather than relying on the icon change alone.
 */
export function SaveButton({
  id,
  title,
  variant = "icon",
  className,
}: {
  /** Scholarship id. */
  id: string;
  /** Used to build the accessible label, e.g. "Global Excellence Scholarship". */
  title: string;
  /** `icon` is a compact square button; `labelled` includes visible text. */
  variant?: "icon" | "labelled";
  className?: string;
}) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(id);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${title}${saved ? " from saved" : ""}`}
      title={saved ? "Remove from saved" : "Save for later"}
      className={cn(
        "group/save inline-flex items-center justify-center gap-2 rounded-full",
        "border transition-[background-color,border-color,color,transform] duration-[240ms]",
        "ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
        variant === "icon" ? "size-9" : "h-11 px-5 text-sm font-medium",
        saved
          ? "border-mint-400/40 bg-mint-400/12 text-mint-200"
          : "border-hairline bg-white/[0.04] text-mist-400 hover:border-hairline-strong hover:bg-white/[0.08] hover:text-mist-100",
        className,
      )}
    >
      <Bookmark
        className={cn(
          "size-4 transition-[fill,transform] duration-[240ms]",
          saved ? "scale-105 fill-current" : "fill-none",
        )}
        aria-hidden="true"
      />
      {variant === "labelled" ? (
        <span>{saved ? "Saved" : "Save Scholarship"}</span>
      ) : null}
    </button>
  );
}