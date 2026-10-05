import type { Metadata } from "next";

import { ProfileBuilder } from "@/components/profile/profile-builder";

const TITLE = "Build your scholarship profile";
const DESCRIPTION =
  "Answer six short sections about your academics, eligibility, experience and preferences, and see how every requirement is scored against real scholarship criteria.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/profile" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/profile",
  },
};

/**
 * Profile page.
 *
 * A server component that renders one client island. The server sends the
 * heading and metadata so the page is meaningful and indexable without
 * JavaScript; the builder needs the browser because the profile it edits lives
 * in `localStorage`, which the server cannot see.
 */
export default function ProfilePage() {
  return <ProfileBuilder />;
}