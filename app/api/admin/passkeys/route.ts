import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { listPasskeys } from "@/lib/passkeys";

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({ success: true, data: await listPasskeys() });
}
