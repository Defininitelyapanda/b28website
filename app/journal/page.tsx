import Image from "next/image";
import Link from "next/link";
import { ensureSeedData, listContent } from "@/lib/cms";
import { PageFrame } from "@/components/public/page-frame";

export const metadata = { title: "Journal", description: "Production notes, stories and updates from B28 Entertainment." };
export const dynamic = "force-dynamic";

export default async function Journal() {
  await ensureSeedData();
  const articles = await listContent("article");
  return <PageFrame pageKey="journal"
    kicker="B28 / Journal"
    title="From the work"
    intro="Production diaries, field notes, company news and conversations with the people behind the frame."
    heroImage="/media/shattered.jpg"
    heroImageAlt="A cinematic frame from a B28 Entertainment film"
  >
    <section className="wrap section-pad">
      <div className="journal-grid">{articles.map((article) => <article className="journal-card" key={article.id}><Link href={`/journal/${article.slug}`}><div className="journal-image"><Image src={article.coverImage || "/media/after-rain.png"} alt="" fill sizes="(max-width:700px) 100vw, 33vw"/></div><p className="meta">{String(article.data.category || "Journal")}</p><h3>{article.title}</h3><p>{article.excerpt}</p></Link></article>)}</div>
    </section>
  </PageFrame>;
}
