import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { Container } from "@/components/ui/container";

interface FooterColumn {
  title: string;
  items: readonly {
    label: string;
    href: string;
  }[];
}

/*
 * Every entry points at a route or homepage section that exists, so the footer
 * has no dead or "coming soon" links. Marketing sections are addressed with
 * `/#id` because the footer renders on every route, not only the homepage.
 */
const COLUMNS: readonly FooterColumn[] = [
  {
    title: "Product",
    items: [
      { label: "Discover Scholarships", href: "/scholarships" },
      { label: "Your Matches", href: "/matches" },
      { label: "Applications", href: "/applications" },
      { label: "Saved", href: "/saved" },
      { label: "AI Companion", href: "/ai-assistant" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Inside a Match", href: "/#matching" },
      { label: "Application Journey", href: "/#journey" },
      { label: "Why ScholarMatch", href: "/#philosophy" },
    ],
  },
  {
    title: "Get Started",
    items: [{ label: "Build Your Profile", href: "/profile" }],
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
                No account needed — your data stays in your browser.
              </p>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
              {COLUMNS.map((column) => (
                <nav key={column.title} aria-label={column.title}>
                  <h2 className="label-micro text-mist-500">{column.title}</h2>

                  <ul className="mt-5 space-y-3">
                    {column.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-sm text-mist-400 transition-colors duration-200 hover:text-mist-50"
                        >
                          {item.label}
                        </Link>
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
              Sample records are illustrative; sourced records are transcribed
              from official provider pages. Always confirm requirements with the
              awarding body.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}