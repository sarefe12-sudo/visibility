import type { MetadataRoute } from "next";
import { posts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://visibilityradar.ai";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/resources/what-is-ai-visibility`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/resources/how-ai-search-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/resources/llm-brand-optimization`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
