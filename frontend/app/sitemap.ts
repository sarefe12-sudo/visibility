import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://visibilityradar.ai";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/product`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/resources/what-is-ai-visibility`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/resources/how-ai-search-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/resources/llm-brand-optimization`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Fetch blog posts from Supabase
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, date")
      .eq("published", true)
      .order("date", { ascending: false })

    blogPages = (data ?? []).map((post: { slug: string; date: string }) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  } catch {
    // fallback: empty blog list
  }

  return [...staticPages, ...blogPages];
}
