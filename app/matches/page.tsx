import type { Metadata } from "next";

import { MatchesView } from "@/components/matches/matches-view";

const TITLE = "Your scholarship matches";
const DESCRIPTION =
  "Every scholarship in the collection ranked against the answers in your own profile, grouped by how well it fits and explained dimension by dimension.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/matches" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/matches",
  },
};

/**
 * Personalised matches page.
 *
 * A server component that renders one client island, for the same reason
 * `/profile` does: the ranking depends on a profile held in `localStorage`, which
 * the server cannot read. The heading and metadata are sent from the server so
 * the route is meaningful before any JavaScript runs, and the island takes over
 * as soon as the stored profile has been read.
 *
 * The explorer and the detail pages are untouched. They stay server-rendered
 * against the demo profile, so a card listed there and the page it links to keep
 * quoting the same number. This route is the place where a student's own answers
 * drive the ranking.
 */
export default function MatchesPage() {
  return <MatchesView />;
}