import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ensureSeedData, listContent } from "@/lib/cms";
import { PageFrame } from "@/components/public/page-frame";

export const metadata = { title: "Services", description: "Development, production and post-production services from B28 Entertainment." };
export const dynamic = "force-dynamic";

export default async function Services() {
  await ensureSeedData();
  const services = await listContent("service");
  return <PageFrame
    kicker="B28 / Capabilities"
    title="Services"
    intro="Original film production and focused short-form storytelling from B28 Entertainment."
    heroImage="/media/fragile-hearts.jpg"
    heroImageAlt="A cinematic scene from a B28 Entertainment production"
  >
    <section className="wrap section-pad">
      <div className="service-list">{services.map((service, index) => <article id={service.slug} className="service-row" key={service.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{service.title}</h3><p>{service.excerpt}</p><ArrowUpRight/></article>)}</div>
      <div className="journal-image" style={{ marginTop: "7rem", aspectRatio: "16/7" }}><Image src="/media/fragile-hearts.jpg" alt="Fragile Hearts official B28 Entertainment film artwork" fill sizes="100vw"/></div>
      <Link href="/contact" className="button light">Discuss a production</Link>
    </section>
  </PageFrame>;
}
