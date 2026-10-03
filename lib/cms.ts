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
    const index = store.content.findIndex((entry) => entry.id === input.id || entry.slug === input.slug);
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
    if (store.content.length > 0) return;
    const stamp = now();
    const records: Array<[ContentType, string, string, string, string, Record<string, unknown>]> = [
      ["project", "after-the-rain", "After the Rain", "A night journey through Nairobi becomes a quiet portrait of distance, memory and return.", "/media/after-rain.png", { year: "2026", format: "Short film", genre: "Drama", runtime: "18 min", director: "B28 Demo Credit", credits: ["Director — B28 Demo Credit", "Producer — B28 Demo Credit", "Cinematography — B28 Demo Credit"], demo: true }],
      ["project", "borrowed-light", "Borrowed Light", "Two siblings rebuild a broken projector and discover a fragment of their family story.", "/media/b28-hero.png", { year: "2026", format: "Documentary short", genre: "Documentary", runtime: "22 min", demo: true }],
      ["article", "inside-the-cut", "Inside the Cut", "A field note on rhythm, silence and shaping emotion in the edit.", "/media/after-rain.png", { category: "Production diary", author: "B28 Editorial", demo: true }],
      ["service", "film-production", "Film Production", "From development to delivery, we build crews and production plans around the story.", "/media/b28-hero.png", { demo: true }],
      ["service", "post-production", "Post Production", "Editorial, sound and colour workflows designed to protect the emotional centre of every piece.", "/media/after-rain.png", { demo: true }],
      ["team", "b28-collective", "The B28 Collective", "A growing network of Kenyan filmmakers, producers and image-makers.", "/media/b28-hero.png", { role: "Creative studio", demo: true }],
    ];
    store.content = records.map((record, index) => ({ id: uid("content"), type: record[0], slug: record[1], title: record[2], status: "published", excerpt: record[3], body: record[3], coverImage: record[4], data: record[5], featured: index < 2, sortOrder: index, publishedAt: stamp, scheduledAt: null, createdAt: stamp, updatedAt: stamp }));
    store.activity.push({ id: uid("activity"), user_id: authorId, action: "seed", object_type: "system", object_id: "demo-content", detail: "Initial demo content", created_at: stamp });
  });
}

export async function ensureAdmin(user: { userId: string; email: string; displayName: string }) {
  return updateStore((store) => {
    const existing = store.users.find((entry) => entry.id === user.userId);
    if (existing) return existing;
    const stamp = now();
    const created = { id: user.userId, email: user.email, name: user.displayName, role: store.users.length === 0 ? "super_admin" : "editor", active: true, created_at: stamp, updated_at: stamp };
    store.users.push(created);
    return created;
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
