import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteContent, listContent, saveContent } from "@/lib/cms";
import { itemPath } from "@/lib/content-url";
import { hasPersistentDataDirectory } from "@/lib/local-store";
import { STUDIO_USER_ID } from "@/lib/studio-identity";
import { contentSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as Parameters<typeof listContent>[0];
  return NextResponse.json({ success: true, data: await listContent(type, true) });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !hasPersistentDataDirectory) return NextResponse.json({ success: false, error: { code: "PERSISTENT_STORAGE_REQUIRED", message: "Publishing is unavailable because persistent CMS storage is not configured on this host." } }, { status: 503 });
  const parsed = contentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "INVALID_CONTENT", message: "Please check the content fields.", issues: parsed.error.flatten() } }, { status: 400 });
  try {
    const data = await saveContent({ id: parsed.data.id || crypto.randomUUID(), type: parsed.data.type, slug: parsed.data.slug, title: parsed.data.title, status: parsed.data.status, excerpt: parsed.data.excerpt, body: parsed.data.body, coverImage: parsed.data.coverImage || null, data: parsed.data.data, featured: parsed.data.featured, sortOrder: parsed.data.sortOrder, scheduledAt: parsed.data.scheduledAt || null, changeSummary: parsed.data.changeSummary }, STUDIO_USER_ID);
    if (data.status === "published") revalidatePath("/", "layout");
    return NextResponse.json({ success: true, data, publicPath: itemPath(data) });
  } catch (error) {
    if (error instanceof Error && error.message === "CONTENT_SLUG_CONFLICT") return NextResponse.json({ success: false, error: { code: "CONTENT_SLUG_CONFLICT", message: "That URL slug is already used by another item. Choose a unique slug." } }, { status: 409 });
    console.error("content_save_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ success: false, error: { code: "SAVE_FAILED", message: "Publishing failed. Your content remains available in the editor—save it as a draft and retry." } }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV === "production" && !hasPersistentDataDirectory) return NextResponse.json({ success: false, error: { code: "PERSISTENT_STORAGE_REQUIRED", message: "Deleting is unavailable because persistent CMS storage is not configured on this host." } }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ success: false, error: { code: "CONTENT_ID_REQUIRED", message: "Choose an item to delete." } }, { status: 400 });
  const deleted = await deleteContent(id, STUDIO_USER_ID);
  if (!deleted) return NextResponse.json({ success: false, error: { code: "CONTENT_NOT_FOUND", message: "That item no longer exists." } }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
