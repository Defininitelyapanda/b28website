import { notFound } from "next/navigation";
import { getContent, getSiteSettings } from "@/lib/cms";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getContent(slug);
  if (!page || page.type !== "page") return { title: "Page not found" };
  return contentMetadata(page);
}

import { ManagedContentView } from "@/components/public/managed-content-view";
export default async function ManagedPage({ params }: { params: Promise<{ slug: string }> }) {
  const [page, settings] = await Promise.all([getContent((await params).slug), getSiteSettings()]);
  if (!page || page.type !== "page") notFound();
  return <ManagedContentView item={page} settings={settings}/>;
}
