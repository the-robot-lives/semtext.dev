import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://semtext.dev",
      lastModified: new Date("2026-09-06"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://semtext.dev/elements/",
      lastModified: new Date("2026-10-13"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://semtext.dev/docs/",
      lastModified: new Date("2026-10-13"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
