import type { MetadataRoute } from "next";

const SITE_URL = "https://scholarmatch.vercel.app";

/**
 * Only the homepage exists in Phase 01. Additional product routes should be
 * added here as they ship, rather than being listed ahead of their creation.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}