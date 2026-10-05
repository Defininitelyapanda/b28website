import type { Metadata } from "next";
import { SiteBuilder } from "@/components/builder/site-builder";
import { ensureSeedData, getSiteDesignDraft, getSiteSettings, listContent } from "@/lib/cms";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "B28 Website Builder", robots: { index: false, follow: false } };

export default async function BuilderPage({ searchParams }: { searchParams: Promise<{ safe?: string }> }) {
  await ensureSeedData(STUDIO_USER_ID);
  const safeMode = (await searchParams).safe === "true";
  const [initial, liveSettings, draft] = await Promise.all([listContent(undefined, true, 500), getSiteSettings(), getSiteDesignDraft()]);
  return <SiteBuilder initial={initial} initialSettings={draft?.settings || liveSettings} recoveredDesignDraft={Boolean(draft)} safeMode={safeMode}/>;
}
