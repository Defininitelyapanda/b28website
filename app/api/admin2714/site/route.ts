import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { discardSiteDesignDraft, getSiteDesignDraft, getSiteSettings, publishSiteDesign, saveSiteDesignDraft } from "@/lib/cms";
import { hasPersistentDataDirectory } from "@/lib/local-store";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export async function GET(request: Request) {
  const draft = new URL(request.url).searchParams.get("mode") === "draft" ? await getSiteDesignDraft() : null;
  return NextResponse.json({ success: true, data: draft?.settings || await getSiteSettings(), meta: { draft: Boolean(draft), updatedAt: draft?.updatedAt || null } });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !hasPersistentDataDirectory) {
    return NextResponse.json({ success: false, error: { message: "Persistent CMS storage is required." } }, { status: 503 });
  }
  try {
    const body = await request.json() as { action?: "save-draft" | "publish" | "discard-draft"; settings?: unknown } & Record<string, unknown>;
    const action = body.action || "publish";
    const input = body.settings && typeof body.settings === "object" ? body.settings : body;
    const data = action === "save-draft" ? await saveSiteDesignDraft(input, STUDIO_USER_ID) : action === "discard-draft" ? await discardSiteDesignDraft(STUDIO_USER_ID) : await publishSiteDesign(input, STUDIO_USER_ID);
    if (action === "publish") revalidatePath("/", "layout");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("site_design_save_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ success: false, error: { message: "The site design could not be saved." } }, { status: 500 });
  }
}
