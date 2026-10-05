import { notFound } from "next/navigation";
import { getContent, getSiteSettings } from "@/lib/cms";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const article = await getContent((await params).slug); return article && article.type === "article" ? contentMetadata(article) : { title: "Journal article not found" }; }
import { ManagedContentView } from "@/components/public/managed-content-view";
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const [article, settings] = await Promise.all([getContent((await params).slug), getSiteSettings()]);
  if (!article || article.type !== "article") notFound();
  return <ManagedContentView item={article} settings={settings}/>;
}
