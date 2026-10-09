import type { Metadata } from "next";

import { SavedView } from "@/components/scholarships/saved-view";

const TITLE = "Saved scholarships";
const DESCRIPTION =
  "Scholarships you saved for later, gathered in one place. Saved items are stored in this browser only.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/saved" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/saved",
  },
};

/**
 * Saved scholarships page.
 *
 * A server component that renders one client island, for the same reason
 * `/matches` does: the saved set lives in `localStorage`, which the server
 * cannot read. The heading and disclosure are sent from the server so the route
 * is meaningful before any JavaScript runs, and the island takes over as soon
 * as the stored ids have been read.
 */
export default function SavedPage() {
  return <SavedView />;
}