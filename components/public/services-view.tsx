"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageFrameView } from "./page-frame-view";
import { ContentBody, contentBlocks } from "@/components/public/content-blocks";


import type { ContentItem } from "@/lib/cms-types";
import type { SiteSettings } from "@/lib/site-settings";
import { useCanvasSettings } from "./use-canvas-settings";
export function ServicesView({ services, settings: initial }: { services: ContentItem[]; settings: SiteSettings }) {
  const settings = useCanvasSettings(initial);
  return <PageFrameView settings={settings} pageKey="services"
    kicker="B28 / Capabilities"
    title="Services"
    intro="Original film production and focused short-form storytelling from B28 Entertainment."
    heroImage="/media/fragile-hearts.jpg"
    heroImageAlt="A cinematic scene from a B28 Entertainment production"
  >
    <section className="wrap section-pad">
      <div className="service-list">{services.map((service, index) => <article id={service.slug} className="service-row service-managed" key={service.id}><span>{String(index + 1).padStart(2, "0")}</span><div><p className="meta">{String(service.data.label || "Service")}</p><h3>{service.title}</h3></div><div><p>{service.excerpt}</p>{(service.body !== service.excerpt || contentBlocks(service.data).length > 0) && <ContentBody body={service.body === service.excerpt ? "" : service.body} blocks={contentBlocks(service.data)}/>}</div><ArrowUpRight/></article>)}</div>
      <div className="journal-image" style={{ marginTop: "7rem", aspectRatio: "16/7" }}><Image src="/media/fragile-hearts.jpg" alt="Fragile Hearts official B28 Entertainment film artwork" fill sizes="100vw"/></div>
      <Link href="/contact" className="button light">Discuss a production</Link>
    </section>
  </PageFrameView>;
}
