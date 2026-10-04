import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { AmbientField } from "@/components/ui/ambient-field";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 should not be indexed, and must not compete with real routes.
  robots: { index: false, follow: true },
};

/**
 * Not-found page.
 *
 * Next.js's built-in fallback renders outside the root layout, so it would lose
 * the site header, the `main` landmark and the skip link. Providing this file
 * keeps a 404 on the same accessibility footing as every other page, and gives
 * a real route back into the product rather than a dead end.
 */
export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-24 sm:pt-36 lg:pt-40">
      <AmbientField />

      <Container className="relative">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>Error 404</Eyebrow>

          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl lg:text-6xl">
            We couldn&apos;t find that page.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-pretty text-mist-400">
            The link may be out of date, or the address may have a typo. The
            scholarship explorer is the best place to pick the search back up.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button href="/scholarships" size="lg">
              <Search className="size-4" aria-hidden="true" />
              Browse scholarships
            </Button>

            <Button href="/" variant="secondary" size="lg">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to home
            </Button>
          </div>

          <nav aria-label="Popular sections" className="mt-12 border-t border-hairline pt-8">
            <p className="label-micro text-mist-500">Popular sections</p>

            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {[
                { label: "How it works", href: "/#how-it-works" },
                { label: "Matching", href: "/#matching" },
                { label: "Your journey", href: "/#journey" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-mist-300 underline decoration-white/15 underline-offset-4 transition-colors duration-200 hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </section>
  );
}