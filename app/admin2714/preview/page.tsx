import { ContentPreview } from "@/components/builder/content-preview";
import { listContent } from "@/lib/cms";
export const dynamic = "force-dynamic";
export const metadata = { title: "Private content preview", robots: { index: false, follow: false } };
export default async function PreviewPage() {
  const [services, team, articles] = await Promise.all([listContent("service"), listContent("team"), listContent("article")]);
  return <ContentPreview services={services} team={team} articles={articles}/>;
}
