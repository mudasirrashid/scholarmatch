import type { MetadataRoute } from "next";

import { allScholarships } from "@/lib/scholarships";

const SITE_URL = "https://www.scholarmatch.me";

/**
 * Lists the routes that actually exist.
 *
 * Scholarship detail URLs are generated from the dataset rather than hardcoded,
 * so the sitemap cannot drift from the routes that are built.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/scholarships`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      // The builder itself, not the profile a visitor builds: the page has no
      // per-user content to index and reads as thin on its own.
      url: `${SITE_URL}/profile`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      // The application-tracking dashboard. The shell and its explanation are
      // server rendered, so it is indexable, but a visitor with nothing
      // tracked only ever sees the empty state, hence the low priority.
      url: `${SITE_URL}/applications`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      // The personalised route. The shell and its explanation are server
      // rendered, so it is indexable, but a visitor with no stored profile only
      // ever sees the onboarding state, hence the low priority.
      url: `${SITE_URL}/matches`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...allScholarships().map((scholarship) => ({
      url: `${SITE_URL}/scholarships/${scholarship.id}`,
      // The dataset carries a real publication date per record, so crawlers see
      // when the entry was added rather than when the site last deployed.
      // Sourced records that state no publication date omit the hint rather
      // than claiming an epoch or a deploy date they never had.
      lastModified: scholarship.postedAt ? new Date(scholarship.postedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}