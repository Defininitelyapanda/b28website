import { z } from "zod";
import { isReservedPageSlug } from "./content-url.ts";

export const contentSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.enum(["page", "project", "article", "service", "team"]),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(160),
  status: z.enum(["draft", "scheduled", "published", "archived"]).default("draft"),
  excerpt: z.string().max(500).default(""),
  body: z.string().max(60000).default(""),
  coverImage: z.string().max(500).nullable().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  scheduledAt: z.string().datetime().nullable().optional(),
  changeSummary: z.string().max(240).default("Saved changes"),
}).superRefine((content, context) => {
  if (content.type === "page" && isReservedPageSlug(content.slug)) context.addIssue({ code: "custom", path: ["slug"], message: "This page address is reserved by the website." });
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(160),
  phone: z.string().max(50).default(""),
  company: z.string().max(120).default(""),
  projectType: z.string().min(2).max(100),
  budget: z.string().max(80).default(""),
  timeline: z.string().max(100).default(""),
  message: z.string().min(10).max(5000),
  website: z.string().max(0).optional(),
});
