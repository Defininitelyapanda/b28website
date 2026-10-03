export type ContentType = "page" | "project" | "article" | "service" | "team";
export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

export type ContentBlock = {
  id: string;
  type: "text" | "quote" | "image" | "video" | "gallery" | "stats" | "timeline" | "cta";
  order: number;
  hidden?: boolean;
  data: Record<string, string | number | boolean | string[]>;
};

export type ContentItem = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  status: ContentStatus;
  excerpt: string;
  body: string;
  coverImage: string | null;
  data: Record<string, unknown>;
  featured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminRole = "super_admin" | "admin" | "editor" | "author" | "media_manager";
