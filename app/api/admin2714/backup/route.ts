import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { readStore, updateStore } from "@/lib/local-store";
import { storeBackup } from "@/lib/storage";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export const runtime = "nodejs";

export async function POST() {
  try {
    const store = await readStore();
    const stamp = new Date().toISOString();
    const id = `backup_${crypto.randomUUID()}`;
    const payload = JSON.stringify({ version: 2, createdAt: stamp, content: store.content, drafts: store.drafts, settings: store.settings, navigation: store.navigation });
    const checksum = createHash("sha256").update(payload).digest("hex");
    await storeBackup(id, payload);
    await updateStore((current) => { current.backups.push({ id, status: "verified", size: Buffer.byteLength(payload), checksum, created_by: STUDIO_USER_ID, created_at: stamp }); });
    return NextResponse.json({ success: true, data: { id, status: "verified", size: Buffer.byteLength(payload), checksum } });
  } catch (error) {
    console.error("backup_failed", error);
    return NextResponse.json({ success: false, error: { code: "BACKUP_FAILED", message: "Backup failed without changing existing data." } }, { status: 500 });
  }
}
