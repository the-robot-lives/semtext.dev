import type { MetadataRoute } from "next";
import { ALL_TAGS, tagSlug } from "@/data/reference-tags";

export const dynamic = "force-static";

const LAST_MODIFIED = new Date("2026-10-13");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://semtext.dev",
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://semtext.dev/reference/",
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // One entry per element page: /reference/<tag>/.
    ...ALL_TAGS.map((t) => ({
      url: `https://semtext.dev/reference/${tagSlug(t.name)}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: "https://semtext.dev/docs/",
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://semtext.dev/editor/",
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
