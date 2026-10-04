import { NextResponse } from "next/server";
import { restoreVersion, versionsFor } from "@/lib/cms";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ success: true, data: await versionsFor(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as { version: number };
  const data = await restoreVersion(id, Number(body.version), STUDIO_USER_ID);
  return data ? NextResponse.json({ success: true, data }) : NextResponse.json({ success: false, error: { code: "VERSION_NOT_FOUND", message: "Version could not be found." } }, { status: 404 });
}
