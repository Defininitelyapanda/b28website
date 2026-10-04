import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCloudflareMedia, uploadsDirectory } from "@/lib/storage";

export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  ".avif": "image/avif", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".pdf": "application/pdf",
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === ".." || path.basename(segment) !== segment)) return new NextResponse("Not found", { status: 404 });
  const object = await getCloudflareMedia(`uploads/${segments.join("/")}`);
  if (object !== undefined) {
    if (!object) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType || "application/octet-stream", ETag: object.etag, "Cache-Control": "public, max-age=31536000, immutable" } });
  }
  const root = path.resolve(uploadsDirectory());
  const filePath = path.resolve(root, ...segments);
  if (!filePath.startsWith(`${root}${path.sep}`)) return new NextResponse("Not found", { status: 404 });
  try {
    const body = await readFile(/* turbopackIgnore: true */ filePath);
    return new NextResponse(body, { headers: { "Content-Type": contentTypes[path.extname(filePath).toLocaleLowerCase()] || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new NextResponse("Not found", { status: 404 });
    throw error;
  }
}
