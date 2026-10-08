import type { Metadata } from "next";

import { ApplicationsView } from "@/components/applications/applications-view";

const TITLE = "Your tracked applications";
const DESCRIPTION =
  "Where each application sits, what its deadline is doing, and the one next step worth taking — tracked in your browser until a decision arrives.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/applications" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/applications",
  },
};

/**
 * Application-tracking dashboard.
 *
 * A server component that renders one client island, for the same reason
 * `/matches` does: tracked applications live in `localStorage`, which the
 * server cannot read. The heading and metadata are sent from the server so the
 * route is meaningful before any JavaScript runs, and the island takes over as
 * soon as the stored records have been read. No status or note ever appears in
 * the server HTML.
 */
export default function ApplicationsPage() {
  return <ApplicationsView />;
}