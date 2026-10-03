import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { ensureSeedData, listContent } from "@/lib/cms";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { ProjectGrid } from "@/components/public/project-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSeedData();
  const [projects, services, articles, team] = await Promise.all([
    listContent("project"), listContent("service"), listContent("article", false, 3), listContent("team", false, 4),
  ]);
  return <div className="site-shell">
    <SiteHeader />
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <Image src="/media/b28-hero.png" alt="Fictional cinematic view across Nairobi at dusk" fill priority sizes="100vw" className="hero-image" />
        <div className="hero-shade" /><div className="grain" aria-hidden="true" />
        <div className="hero-copy wrap"><p className="eyebrow">Nairobi, Kenya · Independent production studio</p><h1 id="hero-title">Stories that<br/><em>stay with you.</em></h1><p className="hero-intro">B28 Entertainment makes emotionally precise films, documentaries and visual work rooted in real human experience.</p><div className="hero-actions"><Link className="button light" href="/work">View our work</Link><Link className="text-link" href="/contact"><span>Start a project</span><ArrowUpRight size={17}/></Link></div></div>
        <div className="hero-index"><span>Featured / 01</span><span className="rule"/><span>Motion · Memory · Culture</span></div>
      </section>
      <section className="statement wrap section-pad"><p className="section-kicker">What moves us</p><h2>We make cinema from the tension between <span>darkness and light,</span> the everyday and the unforgettable.</h2><Link href="/about" className="circle-link" aria-label="About B28"><ArrowUpRight/></Link></section>
      <section className="work-section section-pad" aria-labelledby="featured-title"><div className="wrap section-head"><div><p className="section-kicker">Selected stories / 2026</p><h2 id="featured-title">Featured work</h2></div><Link href="/work" className="text-link"><span>Open archive</span><ArrowUpRight size={17}/></Link></div><ProjectGrid projects={projects} /></section>
      <section className="about-band section-pad"><div className="wrap split"><div><p className="section-kicker">B28 / In focus</p><h2>Human stories.<br/>African perspectives.<br/>No easy answers.</h2></div><div className="about-copy"><p>We are a Kenyan production company working across film, documentary, music, branded stories and experimental screen culture. We build each project around the feeling it needs to leave behind.</p><p>Our process brings development, production and post into one considered creative line.</p><Link className="button outline" href="/about">Meet B28</Link></div></div></section>
      <section className="services-preview wrap section-pad"><div className="section-head"><div><p className="section-kicker">How we work</p><h2>Selected capabilities</h2></div><Link href="/services" className="text-link"><span>All services</span><ArrowUpRight size={17}/></Link></div><div className="service-list">{services.map((service, i)=><Link href={`/services#${service.slug}`} key={service.id} className="service-row"><span>{String(i+1).padStart(2,"0")}</span><h3>{service.title}</h3><p>{service.excerpt}</p><ArrowUpRight/></Link>)}</div></section>
      <section className="journal-preview section-pad"><div className="wrap"><div className="section-head"><div><p className="section-kicker">Notes from the work</p><h2>Journal</h2></div><Link href="/journal" className="text-link"><span>Read all</span><ArrowUpRight size={17}/></Link></div><div className="journal-grid">{articles.map(article=><article className="journal-card" key={article.id}><Link href={`/journal/${article.slug}`}><div className="journal-image"><Image src={article.coverImage || "/media/after-rain.png"} alt="" fill sizes="(max-width: 700px) 100vw, 40vw"/></div><p className="meta">{String(article.data.category || "Journal")} · {new Date(article.publishedAt || article.createdAt).getFullYear()}</p><h3>{article.title}</h3><p>{article.excerpt}</p></Link></article>)}</div></div></section>
      <section className="team-strip wrap section-pad"><p className="section-kicker">The people around the frame</p><div className="team-line"><h2>Made by a growing collective.</h2><p>{team[0]?.excerpt || "Directors, producers, editors and collaborators building a distinct screen language together."}</p><Link href="/about#people" className="text-link"><span>Our people</span><ArrowUpRight size={17}/></Link></div></section>
      <section className="final-cta"><div className="wrap"><p className="section-kicker">A story taking shape?</p><h2>Let’s make something<br/><em>worth remembering.</em></h2><Link href="/contact" className="button light">Start a project</Link></div><Play className="cta-mark" aria-hidden="true"/></section>
    </main><SiteFooter />
  </div>;
}
