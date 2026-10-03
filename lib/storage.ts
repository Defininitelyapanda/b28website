import { env } from "cloudflare:workers";

const allowed = new Set(["image/jpeg","image/png","image/webp","image/avif","image/svg+xml","video/mp4","video/webm","audio/mpeg","audio/wav","application/pdf"]);
const maxBytes = 250 * 1024 * 1024;

export function validateUpload(file: File) {
  if (!allowed.has(file.type)) throw new Error("UNSUPPORTED_MEDIA_TYPE");
  if (file.size > maxBytes) throw new Error("FILE_TOO_LARGE");
  if (file.type === "image/svg+xml") throw new Error("SVG_REQUIRES_SANITIZATION");
}

export async function storeMedia(file: File) {
  if (!env.BUCKET) throw new Error("STORAGE_UNAVAILABLE");
  validateUpload(file);
  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  const key = `media/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" }, customMetadata: { originalName: file.name.slice(0,180) } });
  return key;
}
