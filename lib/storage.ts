import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cloudflareMediaBucket } from "./cloudflare-bindings";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "audio/mpeg", "audio/wav", "application/pdf"]);
const maxBytes = 250 * 1024 * 1024;

export function uploadsDirectory() {
  const configured = process.env.B28_BUILD_PHASE === "1" ? undefined : process.env.CMS_UPLOAD_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "public", "uploads");
}

export const hasCloudflareMediaStorage = Boolean(cloudflareMediaBucket());

export function validateUpload(file: File) {
  if (!allowed.has(file.type)) throw new Error("UNSUPPORTED_MEDIA_TYPE");
  if (file.size > maxBytes) throw new Error("FILE_TOO_LARGE");
}

export async function storeMedia(file: File) {
  validateUpload(file);
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  const directoryName = new Date().toISOString().slice(0, 10);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const bucket = cloudflareMediaBucket();
  if (bucket) {
    const key = `uploads/${directoryName}/${fileName}`;
    await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return `/${key}`;
  }
  const directory = path.join(uploadsDirectory(), directoryName);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ directory, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${directoryName}/${fileName}`;
}

export async function getCloudflareMedia(key: string) {
  const bucket = cloudflareMediaBucket();
  if (!bucket) return undefined;
  return bucket.get(key);
}

export async function storeBackup(id: string, payload: string) {
  const bucket = cloudflareMediaBucket();
  if (bucket) {
    await bucket.put(`backups/${id}.json`, payload, { httpMetadata: { contentType: "application/json" } });
    return;
  }
  const directory = path.join(process.cwd(), "data", "backups");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${id}.json`), payload, "utf8");
}
