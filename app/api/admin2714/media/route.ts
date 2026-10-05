import { NextResponse } from "next/server";
import { storeMedia } from "@/lib/storage";
import { readStore, updateStore } from "@/lib/local-store";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export const runtime = "nodejs";

export async function GET() {
  const store = await readStore();
  const data = [...store.media].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 500);
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("FILE_REQUIRED");
    const key = await storeMedia(file);
    const id = `media_${crypto.randomUUID()}`;
    await updateStore((store) => { store.media.push({ id, storage_key: key, filename: file.name, title: String(form.get("title") || file.name), description: String(form.get("description") || ""), alt_text: String(form.get("altText") || ""), mime_type: file.type, size: file.size, tags: [], uploader_id: STUDIO_USER_ID, created_at: new Date().toISOString() }); });
    return NextResponse.json({ success: true, data: { id, key } }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
    return NextResponse.json({ success: false, error: { code, message: "Upload failed. The file was not saved; you can retry safely." } }, { status: 400 });
  }
}
