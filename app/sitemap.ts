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
    ...allScholarships().map((scholarship) => ({
      url: `${SITE_URL}/scholarships/${scholarship.id}`,
      // The dataset carries a real publication date per record, so crawlers see
      // when the entry was added rather than when the site last deployed.
      lastModified: new Date(scholarship.postedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}