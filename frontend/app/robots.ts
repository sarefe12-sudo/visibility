import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/analyze", "/dashboard", "/profile", "/api/"],
      },
    ],
    sitemap: "https://visibilityradar.ai/sitemap.xml",
  };
}
