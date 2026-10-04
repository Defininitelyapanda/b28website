import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSiteSettings, saveSiteSettings } from "@/lib/cms";
import { hasPersistentDataDirectory } from "@/lib/local-store";

export async function GET() {
  return NextResponse.json({ success: true, data: await getSiteSettings() });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !hasPersistentDataDirectory) {
    return NextResponse.json({ success: false, error: { message: "Persistent CMS storage is required." } }, { status: 503 });
  }
  try {
    const data = await saveSiteSettings(await request.json());
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("site_design_save_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ success: false, error: { message: "The site design could not be saved." } }, { status: 500 });
  }
}
