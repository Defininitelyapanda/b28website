import type { ContentItem, ContentType } from "./cms-types";
import { readStore, updateStore } from "./local-store";

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export async function listContent(type?: ContentType, includeDrafts = false, limit = 50) {
  const store = await readStore();
  return store.content
    .filter((entry) => (!type || entry.type === type) && (includeDrafts || entry.status === "published"))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, limit);
}

export async function getContent(slug: string, includeDrafts = false) {
  const store = await readStore();
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
    const index = store.content.findIndex((entry) => entry.id === input.id);
    const slugOwner = store.content.findIndex((entry) => entry.slug === input.slug);
    if (slugOwner >= 0 && slugOwner !== index) throw new Error("CONTENT_SLUG_CONFLICT");
    const current = index >= 0 ? store.content[index] : null;
    const stamp = now();
    const id = current?.id ?? input.id ?? uid("content");
    const version = store.versions.filter((entry) => entry.content_id === id).length + 1;
    const publishedAt = input.status === "published" ? current?.publishedAt ?? stamp : null;
    const saved: ContentItem = { id, type: input.type, slug: input.slug, title: input.title, status: input.status, excerpt: input.excerpt, body: input.body, coverImage: input.coverImage, data: input.data, featured: input.featured, sortOrder: input.sortOrder, publishedAt, scheduledAt: input.scheduledAt, createdAt: current?.createdAt ?? stamp, updatedAt: stamp };
    if (index >= 0) store.content[index] = saved; else store.content.push(saved);
    store.versions.push({ id: uid("version"), content_id: id, version, snapshot: saved, author_id: authorId, summary: input.changeSummary ?? "Saved changes", created_at: stamp });
    store.activity.push({ id: uid("activity"), user_id: authorId, action: current ? "update" : "create", object_type: input.type, object_id: id, detail: input.status, created_at: stamp });
    return saved;
  });
}

export async function restoreVersion(contentId: string, version: number, authorId: string) {
  const store = await readStore();
  const row = store.versions.find((entry) => entry.content_id === contentId && Number(entry.version) === version);
  if (!row) return null;
  const snapshot = row.snapshot as ContentItem;
  return saveContent({ ...snapshot, changeSummary: `Restored version ${version}` }, authorId);
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
      ["team", "b28-entertainment", "B28 Entertainment", "Entertainment made, simply for you.", "/media/b28-logo.jpg", { role: "Kenyan film studio" }],
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
