import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readStore } from "@/lib/local-store";

export const runtime = "nodejs";
export async function GET() {
  const checks = { application: "healthy", database: "unavailable", storage: "unavailable", environment: "local" };
  try { await readStore(); checks.database = "healthy"; } catch (error) { console.error("health_database_failed", error); }
  try { const uploads = path.join(process.cwd(), "public", "uploads"); await mkdir(uploads, { recursive: true }); await access(uploads); checks.storage = "healthy"; } catch (error) { console.error("health_storage_failed", error); }
  const healthy = checks.database === "healthy" && checks.storage === "healthy";
  return NextResponse.json({ status: healthy ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503 });
}
