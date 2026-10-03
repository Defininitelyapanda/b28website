import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authz";
import { readStore, updateStore } from "@/lib/local-store";

export const runtime = "nodejs";
export async function POST() {
  const admin = await requireAdminApi();
  if (!admin || !["super_admin", "admin"].includes(admin.role)) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Administrator access required." } }, { status: 403 });
  try {
    const store = await readStore();
    const stamp = new Date().toISOString();
    const id = `backup_${crypto.randomUUID()}`;
    const payload = JSON.stringify({ version: 1, createdAt: stamp, content: store.content, settings: store.settings, navigation: store.navigation });
    const checksum = createHash("sha256").update(payload).digest("hex");
    const directory = path.join(process.cwd(), "data", "backups");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${id}.json`), payload, "utf8");
    await updateStore((current) => { current.backups.push({ id, status: "verified", size: Buffer.byteLength(payload), checksum, created_by: admin.userId, created_at: stamp }); });
    return NextResponse.json({ success: true, data: { id, status: "verified", size: Buffer.byteLength(payload), checksum } });
  } catch (error) {
    console.error("backup_failed", error);
    return NextResponse.json({ success: false, error: { code: "BACKUP_FAILED", message: "Backup failed without changing existing data." } }, { status: 500 });
  }
}
