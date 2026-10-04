"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/motion";

interface NavItem {
  label: string;
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
            {/*
              Authentication does not exist in Phase 01. Both actions target
              the on-page conversion section rather than non-existent routes.
            */}
            <Button href="#final-cta" variant="ghost" size="sm">
              Sign In
            </Button>
            <Button href="#final-cta" variant="secondary" size="sm">
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
              <Button href="#final-cta" variant="secondary" size="md">
                Sign In
              </Button>
              <Button href="#final-cta" variant="primary" size="md">
                Get Started
              </Button>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  );
}