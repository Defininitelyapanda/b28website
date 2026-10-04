import { access, mkdir } from "node:fs/promises";
import { NextResponse } from "next/server";
import { hasPersistentDataDirectory, localDataPaths, readStore } from "@/lib/local-store";
import { uploadsDirectory } from "@/lib/storage";

export const runtime = "nodejs";
export async function GET() {
  const checks = { application: "healthy", database: "unavailable", storage: "unavailable", environment: hasPersistentDataDirectory ? "persistent" : "ephemeral" };
  try { await readStore(); checks.database = "healthy"; } catch (error) { console.error("health_database_failed", error); }
  try { const uploads = uploadsDirectory(); await mkdir(uploads, { recursive: true }); await access(uploads); await access(localDataPaths().dataDirectory); checks.storage = "healthy"; } catch (error) { console.error("health_storage_failed", error); }
  const healthy = checks.database === "healthy" && checks.storage === "healthy" && (process.env.NODE_ENV !== "production" || hasPersistentDataDirectory);
  return NextResponse.json({ status: healthy ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503 });
}
