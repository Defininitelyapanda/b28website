import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { ensureSeedData, listContent } from "@/lib/cms";
import { syncYouTubeProjects } from "@/lib/youtube-projects";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { ProjectGrid } from "@/components/public/project-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSeedData();
  await syncYouTubeProjects();
  const [projects, services, articles, team] = await Promise.all([
    listContent("project"), listContent("service"), listContent("article", false, 3), listContent("team", false, 4),
  ]);
  return <div className="site-shell">
    <SiteHeader />
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <Image src="/media/b28-hero.png" alt="A cinematic view across Nairobi at sunset" fill priority sizes="100vw" className="hero-image" />
        <div className="hero-shade" /><div className="grain" aria-hidden="true" />
        <div className="hero-copy wrap"><p className="eyebrow">Nairobi, Kenya · Original Kenyan films</p><h1 id="hero-title">Entertainment made,<br/><em>simply for you.</em></h1><p className="hero-intro">B28 Entertainment creates short films about love, faith, family, youth, mental health and the realities people carry.</p><div className="hero-actions"><Link className="button light" href="/work">Explore our films</Link><a className="text-link" href="https://www.youtube.com/@officialb28entertainment" target="_blank" rel="noreferrer"><span>Watch on YouTube</span><ArrowUpRight size={17}/></a></div></div>
        <div className="hero-index"><span>B28 Entertainment</span><span className="rule"/><span>Nairobi, Kenya</span></div>
      </section>
      <section className="statement wrap section-pad"><p className="section-kicker">What we make</p><h2>Kenyan stories about the choices, pressures and <span>connections that shape us.</span></h2><Link href="/about" className="circle-link" aria-label="About B28"><ArrowUpRight/></Link></section>
      <section className="work-section section-pad" aria-labelledby="featured-title"><div className="wrap section-head"><div><p className="section-kicker">Official films / Latest releases</p><h2 id="featured-title">Featured projects</h2></div><Link href="/work" className="text-link"><span>Open archive</span><ArrowUpRight size={17}/></Link></div><ProjectGrid projects={projects} /></section>
      <section className="about-band section-pad"><div className="wrap split"><div><p className="section-kicker">B28 / In focus</p><h2>Entertainment made,<br/>simply for you.</h2></div><div className="about-copy"><p>B28 Entertainment creates original Kenyan short films rooted in contemporary relationships, family, youth and mental health.</p><p>Every release is available through our official YouTube channel, supported by trailers and short-form moments across our social platforms.</p><Link className="button outline" href="/about">About B28</Link></div></div></section>
      <section className="services-preview wrap section-pad"><div className="section-head"><div><p className="section-kicker">How we work</p><h2>Selected capabilities</h2></div><Link href="/services" className="text-link"><span>All services</span><ArrowUpRight size={17}/></Link></div><div className="service-list">{services.map((service, i)=><Link href={`/services#${service.slug}`} key={service.id} className="service-row"><span>{String(i+1).padStart(2,"0")}</span><h3>{service.title}</h3><p>{service.excerpt}</p><ArrowUpRight/></Link>)}</div></section>
      {articles.length>0&&<section className="journal-preview section-pad"><div className="wrap"><div className="section-head"><div><p className="section-kicker">Notes from the work</p><h2>Journal</h2></div><Link href="/journal" className="text-link"><span>Read all</span><ArrowUpRight size={17}/></Link></div><div className="journal-grid">{articles.map(article=><article className="journal-card" key={article.id}><Link href={`/journal/${article.slug}`}><div className="journal-image"><Image src={article.coverImage || "/media/b28-logo.jpg"} alt="" fill sizes="(max-width: 700px) 100vw, 40vw"/></div><p className="meta">{String(article.data.category || "Journal")} · {new Date(article.publishedAt || article.createdAt).getFullYear()}</p><h3>{article.title}</h3><p>{article.excerpt}</p></Link></article>)}</div></div></section>}
      <section className="team-strip wrap section-pad"><p className="section-kicker">B28 Entertainment</p><div className="team-line"><h2>Original films. Kenyan stories.</h2><p>{team[0]?.excerpt || "Entertainment made, simply for you."}</p><Link href="/about" className="text-link"><span>About us</span><ArrowUpRight size={17}/></Link></div></section>
      <section className="final-cta"><div className="wrap"><p className="section-kicker">Watch the catalogue</p><h2>Entertainment made,<br/><em>simply for you.</em></h2><a href="https://www.youtube.com/@officialb28entertainment" target="_blank" rel="noreferrer" className="button light">Open YouTube</a></div><Play className="cta-mark" aria-hidden="true"/></section>
    </main><SiteFooter />
  </div>;
}
