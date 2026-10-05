"use client";
import Image from "next/image";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { SiteTheme } from "./site-theme";
import type { SitePageKey, SiteSettings } from "@/lib/site-settings";
import { useCanvasSettings } from "./use-canvas-settings";

export function PageFrameView({ settings: initial, kicker, title, intro, heroImage, heroImageAlt, children, pageKey }: { settings: SiteSettings; kicker: string; title: string; intro: string; heroImage: string; heroImageAlt: string; children: React.ReactNode; pageKey?: SitePageKey }) {
  const settings = useCanvasSettings(initial);
  const design = pageKey ? settings.pages[pageKey] : undefined;
  const copy = design?.copy || {};
  return <SiteTheme settings={settings} page={design}><SiteHeader settings={settings}/><main><header className="page-hero" style={{ minHeight: design ? `${design.heroHeight}svh` : undefined }}><Image src={design?.heroImage || heroImage} alt={design?.heroAlt || heroImageAlt} fill priority sizes="100vw" className="page-hero-image" style={{ objectPosition: design?.heroPosition }}/><div className="page-hero-shade" style={design ? { opacity: design.overlayStrength / 100 } : undefined}/><div className="grain" aria-hidden="true"/><div className="wrap page-hero-copy"><p className="section-kicker">{design?.kicker || kicker}</p><h1>{design?.title || title}</h1><p>{design?.intro || intro}</p></div></header>{copy.sectionHeading || copy.sectionBody ? <section className="wrap section-pad prose-page page-custom-copy"><h2>{copy.sectionHeading}</h2><p>{copy.sectionBody}</p>{copy.secondHeading && <h2>{copy.secondHeading}</h2>}{copy.secondBody && <p>{copy.secondBody}</p>}{copy.finalHeading && <h2>{copy.finalHeading}</h2>}{copy.finalBody && <p>{copy.finalBody}</p>}</section> : null}{children}</main><SiteFooter settings={settings}/></SiteTheme>;
}

