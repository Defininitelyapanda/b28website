import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  coverImage: text("cover_image"),
  data: text("data").notNull().default("{}"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: text("published_at"),
  scheduledAt: text("scheduled_at"),
  ...timestamps,
});

export const contentVersions = sqliteTable("content_versions", {
  id: text("id").primaryKey(),
  contentId: text("content_id").notNull(),
  version: integer("version").notNull(),
  snapshot: text("snapshot").notNull(),
  authorId: text("author_id").notNull(),
  summary: text("summary").notNull().default("Saved changes"),
  createdAt: text("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("editor"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const mediaItems = sqliteTable("media_items", {
  id: text("id").primaryKey(),
  storageKey: text("storage_key").notNull().unique(),
  filename: text("filename").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  altText: text("alt_text").notNull().default(""),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  tags: text("tags").notNull().default("[]"),
  uploaderId: text("uploader_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const navigationItems = sqliteTable("navigation_items", {
  id: text("id").primaryKey(),
  menu: text("menu").notNull().default("main"),
  label: text("label").notNull(),
  href: text("href").notNull(),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  external: integer("external", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  company: text("company").notNull().default(""),
  projectType: text("project_type").notNull(),
  budget: text("budget").notNull().default(""),
  timeline: text("timeline").notNull().default(""),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  objectType: text("object_type").notNull(),
  objectId: text("object_id").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const backups = sqliteTable("backups", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  size: integer("size").notNull().default(0),
  checksum: text("checksum").notNull().default(""),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});
