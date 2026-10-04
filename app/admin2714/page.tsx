import type { Metadata } from "next";
import { SiteBuilder } from "@/components/builder/site-builder";
import { ensureSeedData, listContent } from "@/lib/cms";
import { STUDIO_USER_ID } from "@/lib/studio-identity";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "B28 Website Builder", robots: { index: false, follow: false } };

export default async function BuilderPage() {
  await ensureSeedData(STUDIO_USER_ID);
  return <SiteBuilder initial={await listContent(undefined, true, 500)}/>;
}
