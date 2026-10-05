import Image from "next/image";
import { notFound } from "next/navigation";
import { getContent, getSiteSettings } from "@/lib/cms";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { SiteTheme } from "@/components/public/site-theme";
import { ContentBody, contentBlocks } from "@/components/public/content-blocks";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const article = await getContent((await params).slug); return article && article.type === "article" ? contentMetadata(article) : { title: "Journal article not found" }; }
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([getContent(slug), getSiteSettings()]);
  if (!article || article.type !== "article") notFound();
  return <SiteTheme settings={settings}><SiteHeader settings={settings}/><main><header className="page-hero"><div className="wrap"><p className="section-kicker">{String(article.data.category || "Journal")}</p><h1>{article.title}</h1><p>{article.excerpt}</p></div></header><section className="wrap section-pad prose-page"><div className="journal-image" style={{ aspectRatio: "16/8" }}><Image src={article.coverImage || "/media/after-rain.png"} alt={article.title} fill sizes="100vw"/></div>{article.data.author ? <p className="meta">By {String(article.data.author)}</p> : null}<ContentBody body={article.body} blocks={contentBlocks(article.data)}/></section></main><SiteFooter settings={settings}/></SiteTheme>;
}
