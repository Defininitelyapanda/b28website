import { env } from "cloudflare:workers";
import type { ContentItem, ContentType } from "./cms-types";

type Row = Record<string, unknown>;

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

function db() {
  if (!env.DB) throw new Error("Database is unavailable");
  return env.DB;
}

function item(row: Row): ContentItem {
  return {
    id: String(row.id), type: row.type as ContentType, slug: String(row.slug),
    title: String(row.title), status: row.status as ContentItem["status"],
    excerpt: String(row.excerpt ?? ""), body: String(row.body ?? ""),
    coverImage: row.cover_image ? String(row.cover_image) : null,
    data: JSON.parse(String(row.data ?? "{}")), featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order ?? 0),
    publishedAt: row.published_at ? String(row.published_at) : null,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export async function listContent(type?: ContentType, includeDrafts = false, limit = 50) {
  const clauses = [type ? "type = ?" : "1 = 1", includeDrafts ? "1 = 1" : "status = 'published'"];
  const q = db().prepare(`SELECT * FROM content_items WHERE ${clauses.join(" AND ")} ORDER BY featured DESC, sort_order ASC, published_at DESC LIMIT ?`);
  const result = await q.bind(...(type ? [type, limit] : [limit])).all<Row>();
  return result.results.map(item);
}

export async function getContent(slug: string, includeDrafts = false) {
  const result = await db().prepare(`SELECT * FROM content_items WHERE slug = ? ${includeDrafts ? "" : "AND status = 'published'"} LIMIT 1`).bind(slug).first<Row>();
  return result ? item(result) : null;
}

export async function searchContent(query: string) {
  const pattern = `%${query.replaceAll("%", "").slice(0, 80)}%`;
  const result = await db().prepare("SELECT * FROM content_items WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR body LIKE ?) ORDER BY published_at DESC LIMIT 30").bind(pattern, pattern, pattern).all<Row>();
  return result.results.map(item);
}

export async function saveContent(input: Omit<ContentItem, "createdAt" | "updatedAt" | "publishedAt"> & { changeSummary?: string }, authorId: string) {
  const current = await db().prepare("SELECT * FROM content_items WHERE id = ? OR slug = ? LIMIT 1").bind(input.id, input.slug).first<Row>();
  const stamp = now();
  const id = current ? String(current.id) : input.id || uid("content");
  const versionRow = await db().prepare("SELECT COALESCE(MAX(version), 0) AS version FROM content_versions WHERE content_id = ?").bind(id).first<{version:number}>();
  const version = Number(versionRow?.version ?? 0) + 1;
  const publishedAt = input.status === "published" ? (current?.published_at ? String(current.published_at) : stamp) : null;
  const snapshot = JSON.stringify({ ...input, id, publishedAt, updatedAt: stamp });
  const writes = [
    db().prepare("INSERT INTO content_items (id,type,slug,title,status,excerpt,body,cover_image,data,featured,sort_order,published_at,scheduled_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET type=excluded.type,slug=excluded.slug,title=excluded.title,status=excluded.status,excerpt=excluded.excerpt,body=excluded.body,cover_image=excluded.cover_image,data=excluded.data,featured=excluded.featured,sort_order=excluded.sort_order,published_at=excluded.published_at,scheduled_at=excluded.scheduled_at,updated_at=excluded.updated_at").bind(id,input.type,input.slug,input.title,input.status,input.excerpt,input.body,input.coverImage,JSON.stringify(input.data),input.featured ? 1 : 0,input.sortOrder,publishedAt,input.scheduledAt,current?.created_at ?? stamp,stamp),
    db().prepare("INSERT INTO content_versions (id,content_id,version,snapshot,author_id,summary,created_at) VALUES (?,?,?,?,?,?,?)").bind(uid("version"),id,version,snapshot,authorId,input.changeSummary ?? "Saved changes",stamp),
    db().prepare("INSERT INTO activity_logs (id,user_id,action,object_type,object_id,detail,created_at) VALUES (?,?,?,?,?,?,?)").bind(uid("activity"),authorId,current ? "update" : "create",input.type,id,input.status,stamp),
  ];
  await db().batch(writes);
  return getContent(input.slug, true);
}

export async function restoreVersion(contentId: string, version: number, authorId: string) {
  const row = await db().prepare("SELECT snapshot FROM content_versions WHERE content_id = ? AND version = ?").bind(contentId, version).first<{snapshot:string}>();
  if (!row) return null;
  const snapshot = JSON.parse(row.snapshot) as ContentItem;
  return saveContent({ ...snapshot, changeSummary: `Restored version ${version}` }, authorId);
}

export async function versionsFor(contentId: string) {
  const result = await db().prepare("SELECT id,version,author_id,summary,created_at FROM content_versions WHERE content_id = ? ORDER BY version DESC LIMIT 30").bind(contentId).all<Row>();
  return result.results;
}

export async function dashboardStats() {
  const content = await db().prepare("SELECT type,status,COUNT(*) AS count FROM content_items GROUP BY type,status").all<Row>();
  const media = await db().prepare("SELECT COUNT(*) AS count FROM media_items").first<{count:number}>();
  const messages = await db().prepare("SELECT COUNT(*) AS count FROM contacts WHERE status = 'new'").first<{count:number}>();
  const activity = await db().prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 8").all<Row>();
  return { content: content.results, media: Number(media?.count ?? 0), unread: Number(messages?.count ?? 0), activity: activity.results };
}

export async function ensureSeedData(authorId = "system") {
  const existing = await db().prepare("SELECT COUNT(*) AS count FROM content_items").first<{count:number}>();
  if (Number(existing?.count ?? 0) > 0) return;
  const stamp = now();
  const records = [
    ["project","after-the-rain","After the Rain","A night journey through Nairobi becomes a quiet portrait of distance, memory and return.","/media/after-rain.png",JSON.stringify({year:"2026",format:"Short film",genre:"Drama",runtime:"18 min",director:"B28 Demo Credit",credits:["Director — B28 Demo Credit","Producer — B28 Demo Credit","Cinematography — B28 Demo Credit"],demo:true})],
    ["project","borrowed-light","Borrowed Light","Two siblings rebuild a broken projector and discover a fragment of their family story.","/media/b28-hero.png",JSON.stringify({year:"2026",format:"Documentary short",genre:"Documentary",runtime:"22 min",demo:true})],
    ["article","inside-the-cut","Inside the Cut","A field note on rhythm, silence and shaping emotion in the edit.","/media/after-rain.png",JSON.stringify({category:"Production diary",author:"B28 Editorial",demo:true})],
    ["service","film-production","Film Production","From development to delivery, we build crews and production plans around the story.","/media/b28-hero.png",JSON.stringify({demo:true})],
    ["service","post-production","Post Production","Editorial, sound and colour workflows designed to protect the emotional centre of every piece.","/media/after-rain.png",JSON.stringify({demo:true})],
    ["team","b28-collective","The B28 Collective","A growing network of Kenyan filmmakers, producers and image-makers.","/media/b28-hero.png",JSON.stringify({role:"Creative studio",demo:true})],
  ];
  const statements = records.map((record, index) => db().prepare("INSERT INTO content_items (id,type,slug,title,status,excerpt,body,cover_image,data,featured,sort_order,published_at,scheduled_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(uid("content"),record[0],record[1],record[2],"published",record[3],record[3],record[4],record[5],index < 2 ? 1 : 0,index,stamp,null,stamp,stamp));
  statements.push(db().prepare("INSERT INTO activity_logs (id,user_id,action,object_type,object_id,detail,created_at) VALUES (?,?,?,?,?,?,?)").bind(uid("activity"),authorId,"seed","system","demo-content","Initial demo content",stamp));
  await db().batch(statements);
}

export async function ensureAdmin(user: {userId:string;email:string;displayName:string}) {
  const existing = await db().prepare("SELECT id,role,active FROM users WHERE id = ?").bind(user.userId).first<Row>();
  if (existing) return existing;
  const count = await db().prepare("SELECT COUNT(*) AS count FROM users").first<{count:number}>();
  const stamp = now();
  await db().prepare("INSERT INTO users (id,email,name,role,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(user.userId,user.email,user.displayName,Number(count?.count ?? 0) === 0 ? "super_admin" : "editor",1,stamp,stamp).run();
  return { id: user.userId, role: Number(count?.count ?? 0) === 0 ? "super_admin" : "editor", active: 1 };
}

export async function createContact(input: Record<string,string>) {
  const stamp = now();
  const id = uid("lead");
  await db().prepare("INSERT INTO contacts (id,name,email,phone,company,project_type,budget,timeline,message,status,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'new','',?,?)").bind(id,input.name,input.email,input.phone,input.company,input.projectType,input.budget,input.timeline,input.message,stamp,stamp).run();
  return id;
}

export async function listContacts() {
  const result = await db().prepare("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100").all<Row>();
  return result.results;
}
