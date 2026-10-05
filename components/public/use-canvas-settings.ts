"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeSiteSettings, type SiteSettings } from "@/lib/site-settings";

/** The editor sends drafts to its iframe; normal public pages retain server settings. */
export function useCanvasSettings(initial: SiteSettings) {
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const last = useRef("");
  useEffect(() => {
    if (window.parent === window || new URLSearchParams(window.location.search).get("visual-editor") !== "1") return;
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.source !== "b28-builder" || event.data.type !== "state" || !event.data.settings) return;
      const settings = normalizeSiteSettings(event.data.settings);
      const serialized = JSON.stringify(settings);
      if (serialized !== last.current) { last.current = serialized; setDraft(settings); }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return draft || initial;
}
