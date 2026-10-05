import { notFound } from "next/navigation";
import { PageFrame } from "@/components/public/page-frame";
import { ContentBody, contentBlocks } from "@/components/public/content-blocks";
import { getContent } from "@/lib/cms";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getContent(slug);
  if (!page || page.type !== "page") return { title: "Page not found" };
  return contentMetadata(page);
}

export default async function ManagedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getContent(slug);
  if (!page || page.type !== "page") notFound();
  return <PageFrame
    kicker={String(page.data.kicker || "B28 Entertainment")}
    title={page.title}
    intro={page.excerpt}
    heroImage={page.coverImage || "/media/b28-hero.png"}
    heroImageAlt={String(page.data.imageAlt || page.title)}
  >
    <section className="wrap section-pad prose-page"><ContentBody body={page.body} blocks={contentBlocks(page.data)}/></section>
  </PageFrame>;
}
