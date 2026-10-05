import { ensureSeedData, getSiteSettings, listContent } from "@/lib/cms";
import { AboutView } from "@/components/public/about-view";
export const metadata = { title: "About", description: "B28 Entertainment — entertainment made, simply for you." };
export const dynamic = "force-dynamic";

export default async function About() {
  await ensureSeedData();
  const [articles, team, settings] = await Promise.all([listContent("article"), listContent("team"), getSiteSettings()]);
  return <AboutView articles={articles} team={team} settings={settings}/>;
}
