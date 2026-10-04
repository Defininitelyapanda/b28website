import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin2714", "/api/admin2714/", "/api/"] }, sitemap: `${base}/sitemap.xml` };
}
