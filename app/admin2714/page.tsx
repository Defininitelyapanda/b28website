import type { Metadata } from "next";
import { SiteBuilder } from "@/components/builder/site-builder";
import { ensureSeedData, getSiteSettings, listContent } from "@/lib/cms";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "B28 Website Builder", robots: { index: false, follow: false } };

export default async function BuilderPage() {
  await ensureSeedData(STUDIO_USER_ID);
  const [initial, initialSettings] = await Promise.all([listContent(undefined, true, 500), getSiteSettings()]);
  return <SiteBuilder initial={initial} initialSettings={initialSettings}/>;
}
