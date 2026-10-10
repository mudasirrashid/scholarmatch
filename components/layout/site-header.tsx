"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/motion";

interface NavItem {
  label: string;
  /** Absolute product route, valid from any page. */
  href: string;
}

/*
 * The nav lists the product's actual surfaces, so every destination is one
 * click away from any page. The marketing story (how it works, matching,
 * journey) stays reachable from the homepage sections the footer links to.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { label: "Discover", href: "/scholarships" },
  { label: "Matches", href: "/matches" },
  { label: "Applications", href: "/applications" },
  { label: "Saved", href: "/saved" },
  { label: "Companion", href: "/ai-assistant" },
];

/* The one conversion action: start the profile that personalises everything. */
const PRIMARY_HREF = "/profile";

export function SiteHeader() {
  const scrolled = useScrolled(16);
  const [menuOpen, setMenuOpen] = useState(false);

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
            {/*
              The wordmark's "Scholar" is inked for the surface it sits on, so
              both lockups ship and the active theme reveals the matching one
              (see `.brand-logo-*` in app/globals.css). Both are marked
              `priority`: the header is above the fold and the swap on theme
              change must be instant.
            */}
            <Image
              src="/scholarmatch-logo.png"
              alt="ScholarMatch"
              width={524}
              height={112}
              priority
              className="brand-logo-dark h-8 w-auto"
            />
            <Image
              src="/scholarmatch-logo-light.png"
              alt="ScholarMatch"
              width={524}
              height={112}
              priority
              className="brand-logo-light h-8 w-auto"
            />
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative inline-flex h-9 items-center rounded-full px-3.5 text-sm text-mist-400 transition-colors duration-200 hover:text-mist-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <ThemeToggle />
            {/*
              There is no authentication yet, so the single conversion action
              targets the profile builder: it is where a visitor's own answers
              live, and what every personalised surface reads from.
            */}
            <Button href={PRIMARY_HREF} variant="primary" size="sm">
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
            className="grid size-10 place-items-center rounded-full border border-hairline bg-tint/[0.04] text-mist-100 transition-colors duration-200 hover:bg-tint/[0.09] lg:hidden"
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
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-hairline-soft py-3.5 text-base text-mist-200 transition-colors duration-200 hover:text-mist-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2.5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <span className="label-micro text-mist-500">Appearance</span>
                <ThemeToggle />
              </div>
              <Button href={PRIMARY_HREF} variant="primary" size="md">
                Get Started
              </Button>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  );
}