"use client";
import Image from "next/image";
import Link from "next/link";
import { PageFrameView } from "./page-frame-view";
import { JournalGrid } from "./journal-grid";


import type { ContentItem } from "@/lib/cms-types";
import type { SiteSettings } from "@/lib/site-settings";
import { useCanvasSettings } from "./use-canvas-settings";
export function AboutView({ articles, team, settings: initial }: { articles: ContentItem[]; team: ContentItem[]; settings: SiteSettings }) {
  const settings = useCanvasSettings(initial);
  return <PageFrameView settings={settings} pageKey="about" kicker="B28 / About" title="A Kenyan studio with a human point of view." intro="B28 Entertainment creates short dramas rooted in contemporary life, relationships and the pressures people carry." heroImage="/media/b28-hero.png" heroImageAlt="A cinematic view across Nairobi at sunset">
    <section className="wrap about-logo-section"><div className="about-logo"><Image src={settings.logo} alt={`${settings.brandName} logo`} width={900} height={900}/></div></section>
    {team.length > 0 && <section className="wrap section-pad"><div className="section-head"><div><p className="section-kicker">The people behind the work</p><h2>Team</h2></div></div><div className="team-grid">{team.map((member) => <article className="team-card" id={member.slug} key={member.id}><p className="meta">{String(member.data.role || "B28 Entertainment")}</p><h3>{member.title}</h3><p>{member.excerpt === settings.tagline ? "A Nairobi studio creating intimate films rooted in contemporary life." : member.excerpt}</p></article>)}</div></section>}
    {articles.length > 0 && <section className="journal-preview section-pad"><div className="wrap about-journal"><div className="section-head"><div><p className="section-kicker">From the studio</p><h2>Journal</h2></div><Link href="/journal" className="text-link"><span>Read all</span></Link></div><JournalGrid articles={articles} fallbackImage={settings.logo}/></div></section>}
  </PageFrameView>;
}
