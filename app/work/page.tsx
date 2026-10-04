import { ensureSeedData, listContent } from "@/lib/cms";
import { syncYouTubeProjects } from "@/lib/youtube-projects";
import { PageFrame } from "@/components/public/page-frame";
import { ProjectGrid } from "@/components/public/project-grid";

export const metadata = { title: "Work", description: "Explore films, documentaries and visual work by B28 Entertainment." };
export const dynamic = "force-dynamic";

export default async function Work() {
  await ensureSeedData();
  await syncYouTubeProjects();
  const projects = await listContent("project");
  return <PageFrame pageKey="work"
    kicker="B28 / The archive"
    title="Projects"
    intro="Original Kenyan short films exploring relationships, family, youth, mental health and the realities carried in silence."
    heroImage="/media/threshold.jpg"
    heroImageAlt="A cinematic frame from the B28 Entertainment film Threshold"
  >
    <section className="section-pad"><ProjectGrid projects={projects} archive/></section>
  </PageFrame>;
}
