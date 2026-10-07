import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { Container } from "@/components/ui/container";

interface FooterColumn {
  title: string;
  items: readonly {
    label: string;
    /**
     * `undefined` means the destination does not exist yet in Phase 01 and is
     * rendered as an inert, explicitly marked placeholder.
     */
    href?: string;
  }[];
}

const COLUMNS: readonly FooterColumn[] = [
  {
    title: "Product",
    items: [
      { label: "Discover Scholarships", href: "#discover" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Matching", href: "#matching" },
      { label: "Application Journey", href: "#journey" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Guides" },
      { label: "Application Help" },
      { label: "Eligibility Glossary" },
    ],
  },
  {
    title: "Company",
    items: [{ label: "About", href: "#philosophy" }, { label: "Contact" }],
  },
  {
    title: "Legal",
    items: [{ label: "Privacy" }, { label: "Terms" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-hairline bg-ink-950">
      <Container size="wide">
        <div className="py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)]">
            {/* Identity */}
            <div className="max-w-sm">
              <Link
                href="/"
                aria-label="ScholarMatch home"
                className="inline-block rounded-md"
              >
                <Brand idPrefix="footer" />
              </Link>

              <p className="mt-5 text-sm leading-relaxed text-pretty text-mist-400">
                Scholarship discovery organised around who you are, not around a
                search box.
              </p>

              <p className="label-micro mt-8 text-mist-600">
                Product preview — Phase 01
              </p>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
              {COLUMNS.map((column) => (
                <nav key={column.title} aria-label={column.title}>
                  <h2 className="label-micro text-mist-500">{column.title}</h2>

                  <ul className="mt-5 space-y-3">
                    {column.items.map((item) => (
                      <li key={item.label}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="text-sm text-mist-400 transition-colors duration-200 hover:text-mist-50"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          // No destination exists yet. Rendered as inert text
                          // and labelled for assistive technology rather than
                          // linking somewhere that would not work.
                          <span
                            aria-disabled="true"
                            title="Not available yet"
                            className="inline-flex cursor-not-allowed items-center gap-2 text-sm text-mist-600"
                          >
                            {item.label}
                            <span className="rounded-full border border-hairline px-1.5 py-0.5 font-mono text-[0.5625rem] tracking-[0.12em] text-mist-600 uppercase">
                              Soon
                            </span>
                            <span className="sr-only">— coming soon</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>

          <div className="rule-fade mt-14" />

          <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-mist-500">
              © {new Date().getFullYear()} ScholarMatch. All rights reserved.
            </p>

            <p className="max-w-md text-xs leading-relaxed text-mist-600">
              Preview build. Sample records are illustrative; sourced records are
              transcribed from official provider pages. Always confirm requirements
              with the awarding body.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}