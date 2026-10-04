import type { ContentItem, ContentType } from "./cms-types";

const reservedPageSlugs = new Set(["about", "admin2714", "api", "contact", "journal", "maintenance", "offline", "services", "work"]);

export function isReservedPageSlug(slug: string) {
  return reservedPageSlugs.has(slug);
}

export function contentPath(type: ContentType, slug: string) {
  if (type === "project") return `/work/${slug}`;
  if (type === "article") return `/journal/${slug}`;
  if (type === "service") return `/services#${slug}`;
  if (type === "team") return `/about#${slug}`;
  return `/${slug}`;
}

export function itemPath(item: Pick<ContentItem, "type" | "slug">) {
  return contentPath(item.type, item.slug);
}
