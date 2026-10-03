import type { MetadataRoute } from "next";
import { listContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const items = await listContent(undefined, false, 1000);
  const fixed = ["", "/work", "/about", "/services", "/journal", "/contact"].map((pathname) => ({ url: `${base}${pathname}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: pathname === "" ? 1 : 0.8 }));
  const dynamicItems = items.filter((item) => ["project", "article"].includes(item.type)).map((item) => ({ url: `${base}/${item.type === "project" ? "work" : "journal"}/${item.slug}`, lastModified: new Date(item.updatedAt), changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...fixed, ...dynamicItems];
}
