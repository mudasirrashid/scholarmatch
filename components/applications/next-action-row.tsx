"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import type { NextAction } from "@/lib/applications";

/**
 * The one-line next step for a tracked application.
 *
 * Shared by the dashboard card and the detail-page card, so the same advice is
 * presented the same way everywhere. External destinations are the awarding
 * body's own portals and open in a new tab; internal ones navigate the site.
 * An action without a destination stays text because there is nowhere honest
 * for it to go.
 */
export function NextActionRow({ action }: { action: NextAction }) {
  const external = action.href !== undefined && action.href.startsWith("http");

  const linkClasses =
    "group inline-flex items-center gap-2 text-[0.9375rem] font-medium text-azure-200 transition-colors duration-200 hover:text-azure-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-azure-300";

  return (
    <div className="rounded-xl border border-hairline bg-white/[0.03] p-3.5">
      {action.href ? (
        external ? (
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={linkClasses}
          >
            {action.title}
            <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
          </a>
        ) : (
          <Link href={action.href} className={linkClasses}>
            {action.title}
            <ArrowRight
              className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        )
      ) : (
        <span className="text-[0.9375rem] font-medium text-mist-50">{action.title}</span>
      )}

      <p className="mt-1 text-xs leading-relaxed text-pretty text-mist-400">{action.detail}</p>
    </div>
  );
}