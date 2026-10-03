import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "audio/mpeg", "audio/wav", "application/pdf"]);
const maxBytes = 250 * 1024 * 1024;

export function validateUpload(file: File) {
  if (!allowed.has(file.type)) throw new Error("UNSUPPORTED_MEDIA_TYPE");
  if (file.size > maxBytes) throw new Error("FILE_TOO_LARGE");
}

export async function storeMedia(file: File) {
  validateUpload(file);
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  const directoryName = new Date().toISOString().slice(0, 10);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", directoryName);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${directoryName}/${fileName}`;
}
