import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    { url: `${siteUrl}/berita`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/program`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/anggota`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/merch`, changeFrequency: "weekly", priority: 0.6 },
    {
      url: `${siteUrl}/login`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
