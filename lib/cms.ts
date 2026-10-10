import type { ContentItem, ContentType } from "./cms-types";
import { readStore, updateStore } from "./local-store";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from "./site-settings";

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export async function listContent(type?: ContentType, includeDrafts = false, limit = 50) {
  const store = await readStore();
  const content = includeDrafts ? (() => { const merged = new Map(store.content.map((entry) => [entry.id, entry])); for (const row of store.drafts) { if (row.object_type === "content" && row.snapshot && typeof row.snapshot === "object") { const snapshot = row.snapshot as ContentItem; merged.set(snapshot.id, snapshot); } } return [...merged.values()]; })() : store.content;
  return content
    .filter((entry) => (!type || entry.type === type) && (includeDrafts || entry.status === "published"))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, limit);
}

export async function getContent(slug: string, includeDrafts = false) {
  const store = await readStore();
  if (includeDrafts) { const draft = store.drafts.map((entry) => entry.snapshot as ContentItem | undefined).find((entry) => entry?.slug === slug); if (draft) return draft; }
  return store.content.find((entry) => entry.slug === slug && (includeDrafts || entry.status === "published")) ?? null;
}

export async function searchContent(query: string) {
  const needle = query.trim().toLocaleLowerCase().slice(0, 80);
  if (!needle) return [];
  const store = await readStore();
  return store.content.filter((entry) => entry.status === "published" && [entry.title, entry.excerpt, entry.body].some((value) => value.toLocaleLowerCase().includes(needle))).slice(0, 30);
}

export async function saveContent(input: Omit<ContentItem, "createdAt" | "updatedAt" | "publishedAt"> & { changeSummary?: string }, authorId: string) {
  return updateStore((store) => {
    const liveIndex = store.content.findIndex((entry) => entry.id === input.id); const draftIndex = store.drafts.findIndex((entry) => entry.object_type === "content" && entry.object_id === input.id);
    const draftSnapshot = draftIndex >= 0 ? store.drafts[draftIndex].snapshot as ContentItem : null; const current = draftSnapshot || (liveIndex >= 0 ? store.content[liveIndex] : null);
    const conflictingLive = store.content.find((entry) => entry.slug === input.slug && entry.id !== input.id); const conflictingDraft = store.drafts.map((entry) => entry.snapshot as ContentItem | undefined).find((entry) => entry?.slug === input.slug && entry.id !== input.id);
    if (conflictingLive || conflictingDraft) throw new Error("CONTENT_SLUG_CONFLICT");
    const stamp = now();
    const id = current?.id ?? input.id ?? uid("content");
    const version = store.versions.filter((entry) => entry.content_id === id).length + 1;
    const publishedAt = input.status === "published" ? (liveIndex >= 0 ? store.content[liveIndex].publishedAt : null) ?? stamp : (liveIndex >= 0 ? store.content[liveIndex].publishedAt : null);
    const saved: ContentItem = { id, type: input.type, slug: input.slug, title: input.title, status: input.status, excerpt: input.excerpt, body: input.body, coverImage: input.coverImage, data: input.data, featured: input.featured, sortOrder: input.sortOrder, publishedAt, scheduledAt: input.scheduledAt, createdAt: current?.createdAt ?? stamp, updatedAt: stamp };
    if (input.status === "published") {
      if (liveIndex >= 0) store.content[liveIndex] = saved; else store.content.push(saved);
      store.drafts = store.drafts.filter((entry) => !(entry.object_type === "content" && entry.object_id === id));
    } else {
      const row = { id: draftIndex >= 0 ? store.drafts[draftIndex].id : uid("draft"), object_type: "content", object_id: id, snapshot: saved, author_id: authorId, updated_at: stamp };
      if (draftIndex >= 0) store.drafts[draftIndex] = row; else store.drafts.push(row);
    }
    store.versions.push({ id: uid("version"), content_id: id, version, snapshot: saved, author_id: authorId, summary: input.changeSummary ?? "Saved changes", created_at: stamp });
    store.activity.push({ id: uid("activity"), user_id: authorId, action: input.status === "published" ? "publish" : current ? "update_draft" : "create_draft", object_type: input.type, object_id: id, detail: input.status, created_at: stamp });
    return saved;
  });
}

export async function deleteContent(id: string, authorId: string) {
  return updateStore((store) => {
    const index = store.content.findIndex((entry) => entry.id === id); const draft = store.drafts.find((entry) => entry.object_type === "content" && entry.object_id === id); const removed = index >= 0 ? store.content[index] : draft?.snapshot as ContentItem | undefined;
    if (!removed) return false;
    if (index >= 0) store.content.splice(index, 1); store.drafts = store.drafts.filter((entry) => !(entry.object_type === "content" && entry.object_id === id));
    const stamp = now();
    store.activity.push({ id: uid("activity"), user_id: authorId, action: "delete", object_type: removed.type, object_id: removed.id, detail: removed.slug, created_at: stamp });
    return true;
  });
}

export async function restoreVersion(contentId: string, version: number, authorId: string) {
  const store = await readStore();
  const row = store.versions.find((entry) => entry.content_id === contentId && Number(entry.version) === version);
  if (!row) return null;
  const snapshot = row.snapshot as ContentItem;
  return saveContent({ ...snapshot, status: "draft", changeSummary: `Restored version ${version} as draft` }, authorId);
}

export async function versionsFor(contentId: string) {
  const store = await readStore();
  return store.versions.filter((entry) => entry.content_id === contentId).sort((a, b) => Number(b.version) - Number(a.version)).slice(0, 30);
}

export async function dashboardStats() {
  const store = await readStore();
  const counts = new Map<string, number>();
  for (const entry of store.content) counts.set(`${entry.type}:${entry.status}`, (counts.get(`${entry.type}:${entry.status}`) ?? 0) + 1);
  return { content: [...counts].map(([key, count]) => { const [type, status] = key.split(":"); return { type, status, count }; }), media: store.media.length, unread: store.contacts.filter((entry) => entry.status === "new").length, activity: [...store.activity].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8) };
}

export async function ensureSeedData(authorId = "system") {
  const current = await readStore();
  if (current.content.some((entry) => entry.data.demo !== true)) return;
  await updateStore((store) => {
    const hasRealContent = store.content.some((entry) => entry.data.demo !== true);
    if (hasRealContent) return;
    const stamp = now();
    const records: Array<[ContentType, string, string, string, string, Record<string, unknown>, string?]> = [
      ["project", "threshold", "Threshold", "A young couple navigates love, faith, work and the difficult question of accepting support from one another.", "/media/threshold.jpg", { year: "2026", format: "Short Film", genre: "Relationship Drama", youtubeUrl: "https://www.youtube.com/watch?v=mN1VCgEjXcg", trailerUrl: "https://www.youtube.com/watch?v=9ZPaXKtFb4o" }],
      ["project", "shattered", "Shattered", "A young man is pushed to his breaking point by life, pressure and the silence around the weight he carries.", "/media/shattered.jpg", { year: "2026", format: "Short Film", genre: "Social Drama", youtubeUrl: "https://www.youtube.com/watch?v=vIvOkmZxvYg", trailerUrl: "https://www.youtube.com/watch?v=Zu9phrxJUgs" }],
      ["project", "betrayed", "Betrayed", "An official Kenyan short film from B28 Entertainment.", "/media/betrayed.jpg", { year: "2025", format: "Short Film", genre: "Family Drama", youtubeUrl: "https://www.youtube.com/watch?v=faBS1DkOivM" }],
      ["project", "please-call-me", "Please Call Me", "In Nairobi, a young woman’s silent struggle unfolds through unanswered “Please Call Me” messages.", "/media/please-call-me.jpg", { year: "2025", format: "Short Film", genre: "Social Drama", runtime: "8 min 37 sec", youtubeUrl: "https://www.youtube.com/watch?v=JJ8rAKMJOfA", trailerUrl: "https://www.youtube.com/watch?v=3Eyvb4eMzX4", recognition: "Official Selection — Filmmaker Sessions Volume 11" }],
      ["project", "kiza", "Kiza", "A Kenyan film about the struggles and pressures of being young.", "/media/kiza.jpg", { year: "2025", format: "Short Film", genre: "Youth Drama", youtubeUrl: "https://www.youtube.com/watch?v=JpKsOGtn5J0", trailerUrl: "https://www.youtube.com/watch?v=f8vQh65dEWU" }],
      ["project", "fragile-hearts", "Fragile Hearts", "A Kenyan relationship drama from B28 Entertainment.", "/media/fragile-hearts.jpg", { year: "2024", format: "Short Film", genre: "Relationship Drama", youtubeUrl: "https://www.youtube.com/watch?v=sSmx-umq-lU", trailerUrl: "https://www.youtube.com/watch?v=6ZfqpV1ZPtQ" }],
      ["service", "film-production", "Film Production", "Original Kenyan films shaped from development through production and release.", "/media/shattered.jpg", {}],
      ["service", "short-form-storytelling", "Short-form Storytelling", "Focused visual stories made for audiences across film and digital platforms.", "/media/threshold.jpg", {}],
      ["team", "b28-entertainment", "B28 Entertainment", "A Nairobi studio creating intimate films rooted in contemporary life.", "/media/b28-logo.jpg", { role: "Kenyan film studio" }],
      ["article", "testimonials", "Testimonials", "What the community had to say about us.", "/media/b28-logo.jpg", { category: "Community" }, "Best experience being on set with the team — Trippy (crew)."],
    ];
    store.content = records.map((record, index) => ({ id: uid("content"), type: record[0], slug: record[1], title: record[2], status: "published", excerpt: record[3], body: record[6] ?? record[3], coverImage: record[4], data: record[5], featured: record[0] === "project" && index < 3, sortOrder: index, publishedAt: stamp, scheduledAt: null, createdAt: stamp, updatedAt: stamp }));
    store.activity.push({ id: uid("activity"), user_id: authorId, action: "seed", object_type: "system", object_id: "official-content", detail: "Official B28 channel catalogue", created_at: stamp });
  });
}

export async function createContact(input: Record<string, string>) {
  return updateStore((store) => {
    const stamp = now();
    const id = uid("lead");
    store.contacts.push({ id, name: input.name, email: input.email, phone: input.phone, company: input.company, project_type: input.projectType, budget: input.budget, timeline: input.timeline, message: input.message, status: "new", notes: "", created_at: stamp, updated_at: stamp });
    return id;
  });
}

export async function listContacts() {
  const store = await readStore();
  return [...store.contacts].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 100);
}

export async function getSiteSettings() {
  const store = await readStore();
  const row = store.settings.find((entry) => entry.key === "site-design");
  return normalizeSiteSettings(row?.value as Partial<SiteSettings> | undefined);
}

export async function getSiteDesignDraft() {
  const store = await readStore();
  const row = store.settings.find((entry) => entry.key === "site-design-draft");
  return row ? { settings: normalizeSiteSettings(row.value as Partial<SiteSettings>), updatedAt: String(row.updated_at || "") } : null;
}

export async function saveSiteDesignDraft(input: Partial<SiteSettings>, authorId = "Development Admin") {
  const settings = normalizeSiteSettings(input);
  await updateStore((store) => {
    const stamp = now(); const index = store.settings.findIndex((entry) => entry.key === "site-design-draft");
    const row = { key: "site-design-draft", value: settings, updated_at: stamp };
    if (index >= 0) store.settings[index] = row;
    else store.settings.push(row);
    const latest = store.activity.at(-1);
    if (!(latest?.action === "autosave" && latest?.object_type === "site-design-draft")) store.activity.push({ id: uid("activity"), user_id: authorId, action: "autosave", object_type: "site-design-draft", object_id: "global", detail: "Saved visual design draft", created_at: stamp });
  });
  return settings;
}

export async function publishSiteDesign(input: Partial<SiteSettings>, authorId = "Development Admin") {
  const settings = normalizeSiteSettings(input);
  return updateStore((store) => {
    const stamp = now(); const liveIndex = store.settings.findIndex((entry) => entry.key === "site-design"); const current = liveIndex >= 0 ? normalizeSiteSettings(store.settings[liveIndex].value as Partial<SiteSettings>) : DEFAULT_SITE_SETTINGS;
    const version = store.versions.filter((entry) => entry.object_type === "site-design").length + 1;
    store.versions.push({ id: uid("version"), object_type: "site-design", object_id: "global", version, snapshot: current, author_id: authorId, summary: "Automatic pre-publish snapshot", created_at: stamp });
    const row = { key: "site-design", value: settings, updated_at: stamp };
    if (liveIndex >= 0) store.settings[liveIndex] = row; else store.settings.push(row);
    store.settings = store.settings.filter((entry) => entry.key !== "site-design-draft");
    store.activity.push({ id: uid("activity"), user_id: authorId, action: "publish", object_type: "site-design", object_id: "global", detail: `Published version ${version + 1}`, created_at: stamp });
    return settings;
  });
}

export async function discardSiteDesignDraft(authorId = "Development Admin") {
  return updateStore((store) => {
    store.settings = store.settings.filter((entry) => entry.key !== "site-design-draft");
    const row = store.settings.find((entry) => entry.key === "site-design"); const settings = normalizeSiteSettings(row?.value as Partial<SiteSettings> | undefined);
    store.activity.push({ id: uid("activity"), user_id: authorId, action: "discard", object_type: "site-design-draft", object_id: "global", detail: "Returned to last published design", created_at: now() });
    return settings;
  });
}

export async function siteDesignVersions() {
  const store = await readStore();
  return store.versions.filter((entry) => entry.object_type === "site-design").sort((a, b) => Number(b.version) - Number(a.version)).slice(0, 50).map((entry) => ({ id: entry.id, version: Number(entry.version), summary: String(entry.summary || "Design snapshot"), author: String(entry.author_id || "Development Admin"), createdAt: String(entry.created_at || "") }));
}

export async function restoreSiteDesignVersion(version: number, authorId = "Development Admin") {
  const store = await readStore(); const row = store.versions.find((entry) => entry.object_type === "site-design" && Number(entry.version) === version);
  if (!row) return null;
  return saveSiteDesignDraft(row.snapshot as Partial<SiteSettings>, authorId);
}

export async function saveSiteSettings(input: Partial<SiteSettings>) { return publishSiteDesign(input); }

export { DEFAULT_SITE_SETTINGS };
