import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { ensureSeedData, getSiteSettings, listContent } from "@/lib/cms";
import { syncYouTubeProjects } from "@/lib/youtube-projects";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { SiteTheme } from "@/components/public/site-theme";
import { ProjectGrid } from "@/components/public/project-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSeedData(); await syncYouTubeProjects();
  const [projects, services, articles, team, settings] = await Promise.all([listContent("project"), listContent("service"), listContent("article", false, 3), listContent("team", false, 4), getSiteSettings()]);
  const home = settings.pages.home;
  return <SiteTheme settings={settings} page={home}><SiteHeader settings={settings}/><main>
    <section className="hero" aria-labelledby="hero-title" style={{ minHeight: `${home.heroHeight}svh` }}><Image src={home.heroImage} alt={home.heroAlt} fill priority sizes="100vw" className="hero-image" style={{ objectPosition: home.heroPosition }}/><div className="hero-shade" style={{ opacity: home.overlayStrength / 100 }}/><div className="grain" aria-hidden="true"/><div className="hero-copy wrap"><p className="eyebrow">{home.kicker}</p><h1 id="hero-title">{home.title}</h1><p className="hero-intro">{home.intro}</p><div className="hero-actions"><Link className="button light" href="/work">Explore our films</Link><a className="text-link" href={settings.social.youtube} target="_blank" rel="noreferrer"><span>Watch on YouTube</span><ArrowUpRight size={17}/></a></div></div><div className="hero-index"><span>{settings.brandName}</span><span className="rule"/><span>{settings.location}</span></div></section>
    <section className="statement wrap section-pad"><p className="section-kicker">What we make</p><h2>{home.copy.statement}</h2><Link href="/about" className="circle-link" aria-label={`About ${settings.brandName}`}><ArrowUpRight/></Link></section>
    <section className="work-section section-pad" aria-labelledby="featured-title"><div className="wrap section-head"><div><p className="section-kicker">Official films / Latest releases</p><h2 id="featured-title">Featured projects</h2></div><Link href="/work" className="text-link"><span>Open archive</span><ArrowUpRight size={17}/></Link></div><ProjectGrid projects={projects}/></section>
    <section className="about-band section-pad"><div className="wrap split"><div><p className="section-kicker">{settings.shortName} / In focus</p><h2>{home.copy.aboutTitle}</h2></div><div className="about-copy"><p>{home.copy.aboutBody}</p><p>Every release is available through our official YouTube channel, supported by trailers and short-form moments across our social platforms.</p><Link className="button outline" href="/about">About {settings.shortName}</Link></div></div></section>
    <section className="services-preview wrap section-pad"><div className="section-head"><div><p className="section-kicker">How we work</p><h2>Selected capabilities</h2></div><Link href="/services" className="text-link"><span>All services</span><ArrowUpRight size={17}/></Link></div><div className="service-list">{services.map((service, i)=><Link href={`/services#${service.slug}`} key={service.id} className="service-row"><span>{String(i+1).padStart(2,"0")}</span><h3>{service.title}</h3><p>{service.excerpt}</p><ArrowUpRight/></Link>)}</div></section>
    {articles.length>0&&<section className="journal-preview section-pad"><div className="wrap"><div className="section-head"><div><p className="section-kicker">Notes from the work</p><h2>Journal</h2></div><Link href="/journal" className="text-link"><span>Read all</span><ArrowUpRight size={17}/></Link></div><div className="journal-grid">{articles.map(article=><article className="journal-card" key={article.id}><Link href={`/journal/${article.slug}`}><div className="journal-image"><Image src={article.coverImage || settings.logo} alt="" fill sizes="(max-width: 700px) 100vw, 40vw"/></div><p className="meta">{String(article.data.category || "Journal")} · {new Date(article.publishedAt || article.createdAt).getFullYear()}</p><h3>{article.title}</h3><p>{article.excerpt}</p></Link></article>)}</div></div></section>}
    <section className="team-strip wrap section-pad"><p className="section-kicker">{settings.brandName}</p><div className="team-line"><h2>Original films. Kenyan stories.</h2><p>{team[0]?.excerpt || settings.tagline}</p><Link href="/about" className="text-link"><span>About us</span><ArrowUpRight size={17}/></Link></div></section>
    <section className="final-cta"><div className="wrap"><p className="section-kicker">Watch the catalogue</p><h2>{home.copy.finalTitle}</h2><a href={settings.social.youtube} target="_blank" rel="noreferrer" className="button light">Open YouTube</a></div><Play className="cta-mark" aria-hidden="true"/></section>
  </main><SiteFooter settings={settings}/></SiteTheme>;
}
