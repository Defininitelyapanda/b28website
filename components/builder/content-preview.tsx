"use client";

import { useEffect, useState } from "react";
import { ManagedContentView } from "@/components/public/managed-content-view";
import type { ContentItem } from "@/lib/cms-types";
import { normalizeSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { ServicesView } from "@/components/public/services-view";
import { AboutView } from "@/components/public/about-view";

export function ContentPreview({ services, team, articles }: { services: ContentItem[]; team: ContentItem[]; articles: ContentItem[] }) {
  const [preview, setPreview] = useState<{ item: ContentItem; settings: SiteSettings } | null>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.source !== "b28-builder" || event.data.type !== "content-preview") return;
      setPreview({ item: event.data.item as ContentItem, settings: normalizeSiteSettings(event.data.settings) });
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ source: "b28-content-preview", type: "ready" }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  if (!preview) return <p role="status">Preparing page preview…</p>;
  const replace = (items: ContentItem[]) => items.some((item) => item.id === preview.item.id) ? items.map((item) => item.id === preview.item.id ? preview.item : item) : [...items, preview.item];
  if (preview.item.type === "service") return <ServicesView services={replace(services)} settings={preview.settings}/>;
  if (preview.item.type === "team") return <AboutView team={replace(team)} articles={articles} settings={preview.settings}/>;
  return <ManagedContentView item={preview.item} settings={preview.settings}/>;
}
