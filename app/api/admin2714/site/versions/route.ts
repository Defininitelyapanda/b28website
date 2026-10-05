import { NextResponse } from "next/server";
import { restoreSiteDesignVersion, siteDesignVersions } from "@/lib/cms";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export async function GET() {
  return NextResponse.json({ success: true, data: await siteDesignVersions() });
}

export async function POST(request: Request) {
  const version = Number((await request.json() as { version?: number }).version);
  if (!Number.isInteger(version) || version < 1) return NextResponse.json({ success: false, error: { message: "Choose a valid design version." } }, { status: 400 });
  const data = await restoreSiteDesignVersion(version, STUDIO_USER_ID);
  if (!data) return NextResponse.json({ success: false, error: { message: "That design version no longer exists." } }, { status: 404 });
  return NextResponse.json({ success: true, data });
}
