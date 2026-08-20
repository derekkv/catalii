import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // No indexar el panel ni endpoints internos.
      disallow: ["/dashboard", "/login", "/auth", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
