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
  ];
}
