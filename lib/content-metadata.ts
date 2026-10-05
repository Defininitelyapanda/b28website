import type { Metadata } from "next";
import type { ContentItem } from "./cms-types";

export function contentMetadata(item: ContentItem): Metadata {
  const seo = item.data.seo && typeof item.data.seo === "object" ? item.data.seo as Record<string, unknown> : {};
  const title = String(seo.title || item.title); const description = String(seo.description || item.excerpt || item.body.slice(0, 160)); const image = String(seo.socialImage || item.coverImage || ""); const canonical = String(seo.canonical || "").trim(); const index = seo.index !== false;
  return { title, description, ...(canonical ? { alternates: { canonical } } : {}), robots: { index, follow: index }, openGraph: { title: String(seo.openGraphTitle || title), description: String(seo.openGraphDescription || description), images: image ? [image] : [] }, twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : [] } };
}
