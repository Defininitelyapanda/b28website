import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { removePasskey } from "@/lib/passkeys";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ success: false }, { status: 401 });
  const { id } = await params;
  const removed = await removePasskey(id);
  return removed
    ? NextResponse.json({ success: true })
    : NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Passkey not found." } }, { status: 404 });
}
