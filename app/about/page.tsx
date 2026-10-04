import Image from "next/image";
import Link from "next/link";
import { PageFrame } from "@/components/public/page-frame";
import { ensureSeedData, listContent } from "@/lib/cms";

export const metadata = { title: "About", description: "B28 Entertainment — entertainment made, simply for you." };
export const dynamic = "force-dynamic";

export default async function About() {
  await ensureSeedData();
  const [articles, team] = await Promise.all([listContent("article"), listContent("team")]);
  return <PageFrame kicker="B28 / About" title="Entertainment made, simply for you." intro="B28 Entertainment is a Kenyan film studio creating short dramas rooted in contemporary life, relationships and the pressures people carry." heroImage="/media/b28-hero.png" heroImageAlt="A cinematic view across Nairobi at sunset">
    <section className="wrap section-pad prose-page"><div className="about-logo"><Image src="/media/b28-logo.jpg" alt="B28 Entertainment official logo" width={900} height={900}/></div><h2>Who we are</h2><p>B28 Entertainment creates original Kenyan films for audiences at home and beyond. Our catalogue moves through love, faith, family, youth and mental health with an eye for the human story inside each subject.</p><h2>Our stories</h2><p>From <em>Fragile Hearts</em> and <em>Kiza</em> to <em>Please Call Me</em>, <em>Betrayed</em>, <em>Shattered</em> and <em>Threshold</em>, our work centres intimate choices and the realities that shape everyday life.</p><h2>Our promise</h2><p>Entertainment made, simply for you.</p></section>
    {team.length > 0 && <section className="wrap section-pad"><div className="section-head"><div><p className="section-kicker">The people behind the work</p><h2>Team</h2></div></div><div className="team-grid">{team.map((member) => <article className="team-card" id={member.slug} key={member.id}><p className="meta">{String(member.data.role || "B28 Entertainment")}</p><h3>{member.title}</h3><p>{member.excerpt}</p></article>)}</div></section>}
    {articles.length > 0 && <section className="journal-preview section-pad"><div className="wrap about-journal"><div className="section-head"><div><p className="section-kicker">From B28</p><h2>Journal</h2></div><Link href="/journal" className="text-link"><span>Read all</span></Link></div><div className="journal-grid">{articles.map((article) => <article className="journal-card" key={article.id}><Link href={`/journal/${article.slug}`}><div className="journal-image"><Image src={article.coverImage || "/media/b28-logo.jpg"} alt={article.title} fill sizes="(max-width:700px) 100vw, 33vw"/></div><p className="meta">{String(article.data.category || "Journal")}</p><h3>{article.title}</h3><p>{article.excerpt}</p></Link></article>)}</div></div></section>}
  </PageFrame>;
}
