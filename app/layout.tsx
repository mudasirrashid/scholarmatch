import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Display face used only for headings. A high-contrast serif gives the page an
 * editorial, academic register that a single neo-grotesque cannot, while body
 * copy stays on Geist for readability. Self-hosted by `next/font`, so this adds
 * no runtime script and no third-party request.
 */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const SITE_URL = "https://scholarmatch.vercel.app";

const TITLE = "ScholarMatch — Find Scholarships That Match You";
const DESCRIPTION =
  "ScholarMatch helps students discover scholarship opportunities matched to their academic profile and goals.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s — ScholarMatch`,
  },
  description: DESCRIPTION,
  applicationName: "ScholarMatch",
  keywords: [
    "scholarships",
    "scholarship matching",
    "study abroad",
    "graduate funding",
    "scholarship search",
  ],
  openGraph: {
    type: "website",
    siteName: "ScholarMatch",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        {/*
          Marks the document as script-capable before first paint so the CSS
          scroll-reveal system can safely hide content by default. Without
          JavaScript nothing is hidden, which keeps the page readable when
          scripting is unavailable or blocked.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>

      <body className="flex min-h-full flex-col bg-ink-950 text-mist-100">
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[60] focus-visible:h-auto focus-visible:w-auto focus-visible:rounded-full focus-visible:bg-mist-50 focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-ink-950 focus-visible:[clip:auto]"
        >
          Skip to content
        </a>

        <SiteHeader />

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}