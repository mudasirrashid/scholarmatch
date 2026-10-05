"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/motion";

interface NavItem {
  label: string;
  /** Homepage section id, resolved to a full path when not on the homepage. */
  href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Discover", href: "#discover" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Matching", href: "#matching" },
  { label: "Journey", href: "#journey" },
  { label: "About", href: "#philosophy" },
];

export function SiteHeader() {
  const scrolled = useScrolled(16);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  /*
   * The nav points at homepage sections. On any other route a bare `#id` would
   * resolve against the current page and land nowhere, so the section links are
   * rewritten to `/#id`. Rendered on the server from the pathname rather than
   * after hydration, so the correct link is in the initial HTML.
   */
  const onHomepage = pathname === "/";
  const navHref = (href: string) => (onHomepage ? href : `/${href}`);

  /* Conversion actions point at the explorer now that it exists. */
  const primaryHref = onHomepage ? "#final-cta" : "/scholarships";

  // Close the mobile sheet when the viewport grows past the breakpoint,
  // otherwise it stays mounted and traps focus behind the header.
  useEffect(() => {
    if (!menuOpen) return;

    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [menuOpen]);

  // Escape closes the sheet; body scroll is locked while it is open.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-[320ms]",
        "ease-[cubic-bezier(0.16,1,0.3,1)]",
        scrolled || menuOpen
          ? "border-b border-hairline bg-ink-950/72 backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container size="wide">
        <div
          className={cn(
            "flex items-center justify-between transition-[height] duration-[320ms]",
            scrolled ? "h-16" : "h-20",
          )}
        >
          <Link
            href="/"
            className="rounded-md"
            aria-label="ScholarMatch home"
          >
            <Brand idPrefix="header" />
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={navHref(item.href)}
                    className="relative inline-flex h-9 items-center rounded-full px-3.5 text-sm text-mist-400 transition-colors duration-200 hover:text-mist-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            {/*
              Authentication does not exist yet, so "Sign In" still targets the
              conversion section. "Get Started" points at the explorer on routes
              that have no conversion section of their own.
            */}
            {/*
              Authentication does not exist yet, so this targets the profile
              builder: it is the closest thing to a personalised entry point, and
              it is where a visitor's own answers would live once accounts
              arrive.
            */}
            <Button href="/profile" variant="ghost" size="sm">
              My Profile
            </Button>
            <Button href={primaryHref} variant="secondary" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full border border-hairline bg-white/[0.04] text-mist-100 transition-colors duration-200 hover:bg-white/[0.09] lg:hidden"
          >
            {menuOpen ? (
              <X className="size-[18px]" aria-hidden="true" />
            ) : (
              <Menu className="size-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile sheet */}
      <div
        id="mobile-navigation"
        hidden={!menuOpen}
        className="border-t border-hairline bg-ink-950/95 backdrop-blur-xl lg:hidden"
      >
        <Container>
          <nav aria-label="Mobile" className="py-4">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={navHref(item.href)}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-hairline-soft py-3.5 text-base text-mist-200 transition-colors duration-200 hover:text-mist-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2.5 pt-5 pb-2">
              <Button href="/profile" variant="secondary" size="md">
                My Profile
              </Button>
              <Button href={primaryHref} variant="primary" size="md">
                Get Started
              </Button>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  );
}