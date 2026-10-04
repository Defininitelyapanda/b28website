import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { getContent } from "@/lib/cms";
import { syncYouTubeProjects } from "@/lib/youtube-projects";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { ContentBody, contentBlocks } from "@/components/public/content-blocks";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await syncYouTubeProjects();
  const project = await getContent(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.excerpt, openGraph: { title: `${project.title} — B28 Entertainment`, description: project.excerpt, images: project.coverImage ? [project.coverImage] : [] } };
}

export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await syncYouTubeProjects();
  const project = await getContent(slug);
  if (!project || project.type !== "project") notFound();
  const credits = Array.isArray(project.data.credits) ? project.data.credits.map(String) : [];
  const youtubeUrl = typeof project.data.youtubeUrl === "string" ? project.data.youtubeUrl : null;
  const trailerUrl = typeof project.data.trailerUrl === "string" ? project.data.trailerUrl : null;
  const recognition = typeof project.data.recognition === "string" ? project.data.recognition : null;
  const runtime = typeof project.data.runtime === "string" ? project.data.runtime : null;
  return <div className="site-shell"><SiteHeader/><main>
    <section className="detail-hero"><Image src={project.coverImage || "/media/b28-logo.jpg"} alt={`${project.title} official film artwork`} fill priority sizes="100vw"/><div className="hero-shade"/><div className="detail-copy wrap"><p className="section-kicker">{String(project.data.format || "Film")} / {String(project.data.year || "")}</p><h1>{project.title}</h1><p>{project.excerpt}</p></div></section>
    <section className="detail-body wrap section-pad"><aside><p className="section-kicker">Production</p><div className="credits">{credits.map((credit) => <span key={credit}>{credit}</span>)}<span>{String(project.data.format || "Short Film")}</span><span>{String(project.data.genre || "Kenyan Film")}</span>{runtime && <span>{runtime}</span>}{recognition && <span>{recognition}</span>}</div></aside>
      <article><ContentBody body={project.body} blocks={contentBlocks(project.data)}/><div className="project-watch-actions">{youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noreferrer" className="button light"><Play size={15}/> Watch film</a>}{trailerUrl && <a href={trailerUrl} target="_blank" rel="noreferrer" className="button outline">Watch trailer</a>}</div>{(youtubeUrl || trailerUrl) && <p className="project-source-note">Film and trailer links open on B28 Entertainment’s official YouTube channel.</p>}<Link href="/contact" className="button outline">Work with B28</Link></article>
    </section>
  </main><SiteFooter/></div>;
}
