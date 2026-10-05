import { ensureSeedData, getSiteSettings, listContent } from "@/lib/cms";
import { syncYouTubeProjects } from "@/lib/youtube-projects";
import { HomeView } from "@/components/public/home-view";

export const dynamic = "force-dynamic";
export default async function Home() {
  await ensureSeedData(); await syncYouTubeProjects();
  const [projects, services, articles, team, settings] = await Promise.all([listContent("project"), listContent("service"), listContent("article", false, 3), listContent("team", false, 4), getSiteSettings()]);
  return <HomeView projects={projects} services={services} articles={articles} team={team} settings={settings}/>;
}
