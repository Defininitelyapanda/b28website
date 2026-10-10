import { ensureSeedData, listContent } from "@/lib/cms";
import { PageFrame } from "@/components/public/page-frame";
import { JournalGrid } from "@/components/public/journal-grid";

export const metadata = { title: "Journal", description: "Production notes, stories and updates from B28 Entertainment." };
export const dynamic = "force-dynamic";

export default async function Journal() {
  await ensureSeedData();
  const articles = await listContent("article");
  return <PageFrame pageKey="journal"
    kicker="B28 / Journal"
    title="From the work"
    intro="Production diaries, field notes, company news and conversations with the people behind the frame."
    heroImage="/media/shattered.jpg"
    heroImageAlt="A cinematic frame from a B28 Entertainment film"
  >
    <section className="wrap section-pad">
      <JournalGrid articles={articles}/>
    </section>
  </PageFrame>;
}
