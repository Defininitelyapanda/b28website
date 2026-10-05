import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { SiteTheme } from "./site-theme";
import { PageFrameView } from "./page-frame-view";
import { ContentBody, contentBlocks } from "./content-blocks";
import type { ContentItem } from "@/lib/cms-types";
import type { SiteSettings } from "@/lib/site-settings";

export function ManagedContentView({ item, settings }: { item: ContentItem; settings: SiteSettings }) {
  if (item.type === "project") return <ProjectView project={item} settings={settings}/>;
  if (item.type === "article") return <ArticleView article={item} settings={settings}/>;
  return <PageFrameView settings={settings} kicker={String(item.data.kicker || "B28 Entertainment")} title={item.title} intro={item.excerpt} heroImage={item.coverImage || "/media/b28-hero.png"} heroImageAlt={String(item.data.imageAlt || item.title)}><section className="wrap section-pad prose-page"><ContentBody body={item.body} blocks={contentBlocks(item.data)}/></section></PageFrameView>;
}

function ProjectView({ project, settings }: { project: ContentItem; settings: SiteSettings }) {
  const credits = Array.isArray(project.data.credits) ? project.data.credits.map(String) : [];
  const youtubeUrl = typeof project.data.youtubeUrl === "string" ? project.data.youtubeUrl : null;
  const trailerUrl = typeof project.data.trailerUrl === "string" ? project.data.trailerUrl : null;
  const recognition = typeof project.data.recognition === "string" ? project.data.recognition : null;
  const runtime = typeof project.data.runtime === "string" ? project.data.runtime : null;
  return <SiteTheme settings={settings}><SiteHeader settings={settings}/><main>
    <section className="detail-hero"><Image src={project.coverImage || "/media/b28-logo.jpg"} alt={`${project.title} official film artwork`} fill priority sizes="100vw"/><div className="hero-shade"/><div className="detail-copy wrap"><p className="section-kicker">{String(project.data.format || "Film")} / {String(project.data.year || "")}</p><h1>{project.title}</h1><p>{project.excerpt}</p></div></section>
    <section className="detail-body wrap section-pad"><aside><p className="section-kicker">Production</p><div className="credits">{credits.map((credit) => <span key={credit}>{credit}</span>)}<span>{String(project.data.format || "Short Film")}</span><span>{String(project.data.genre || "Kenyan Film")}</span>{runtime && <span>{runtime}</span>}{recognition && <span>{recognition}</span>}</div></aside>
      <article><ContentBody body={project.body} blocks={contentBlocks(project.data)}/><div className="project-watch-actions">{youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noreferrer" className="button light"><Play size={15}/> Watch film</a>}{trailerUrl && <a href={trailerUrl} target="_blank" rel="noreferrer" className="button outline">Watch trailer</a>}</div>{(youtubeUrl || trailerUrl) && <p className="project-source-note">Film and trailer links open on B28 Entertainment’s official YouTube channel.</p>}<Link href="/contact" className="button outline">Work with B28</Link></article>
    </section>
  </main><SiteFooter settings={settings}/></SiteTheme>;
}

function ArticleView({ article, settings }: { article: ContentItem; settings: SiteSettings }) {
  return <SiteTheme settings={settings}><SiteHeader settings={settings}/><main><header className="page-hero"><div className="wrap"><p className="section-kicker">{String(article.data.category || "Journal")}</p><h1>{article.title}</h1><p>{article.excerpt}</p></div></header><section className="wrap section-pad prose-page"><div className="journal-image" style={{ aspectRatio: "16/8" }}><Image src={article.coverImage || "/media/after-rain.png"} alt={article.title} fill sizes="100vw"/></div>{article.data.author ? <p className="meta">By {String(article.data.author)}</p> : null}<ContentBody body={article.body} blocks={contentBlocks(article.data)}/></section></main><SiteFooter settings={settings}/></SiteTheme>;
}

