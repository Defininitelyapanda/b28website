import { notFound } from "next/navigation";
import { getContent, getSiteSettings } from "@/lib/cms";
import { syncYouTubeProjects } from "@/lib/youtube-projects";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await syncYouTubeProjects();
  const project = await getContent(slug);
  if (!project) return { title: "Project not found" };
  return contentMetadata(project);
}

import { ManagedContentView } from "@/components/public/managed-content-view";

export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await syncYouTubeProjects();
  const [project, settings] = await Promise.all([getContent(slug), getSiteSettings()]);
  if (!project || project.type !== "project") notFound();
  return <ManagedContentView item={project} settings={settings}/>;
}
