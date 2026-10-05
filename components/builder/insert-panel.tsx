"use client";

import { useState } from "react";
import type { CustomElement, SiteSettings } from "@/lib/site-settings";
import type { SelectedVisualElement } from "@/components/public/visual-editor-runtime";

export function InsertPanel({ settings, path, selected, onChange, onMedia, onPage, onBackground }: { settings: SiteSettings; path: string; selected: SelectedVisualElement | null; onChange: (settings: SiteSettings) => void; onMedia: (receiver: (url: string) => void) => void; onPage: () => void; onBackground: (styles: Record<string, string>) => void }) {
  const [withText, setWithText] = useState(true);
  const [placement, setPlacement] = useState<"before" | "after" | "inside">("after");
  const [tabLabel, setTabLabel] = useState("");
  const [tabUrl, setTabUrl] = useState("");
  function insert(type: CustomElement["type"], columns = 1, source = "") {
    const item: CustomElement = { id: crypto.randomUUID(), path, type, content: type === "heading" ? "New heading" : type === "text" ? "Click to edit your text." : type === "button" ? "New link" : "", src: source, href: type === "button" ? "/contact" : "", order: settings.customElements.filter((element) => element.path === path).length, anchorSelector: selected?.selector || (type === "header" ? ".site-shell main" : type === "footer" ? ".site-shell .site-footer" : ".site-shell main > :first-child"), placement: !selected && (type === "header" || type === "footer") ? "before" : placement, columns, cards: type === "gallery" ? Array.from({ length: columns }, () => ({ image: "/media/b28-logo.jpg", heading: withText ? "Your heading" : "", body: withText ? "Add your description here." : "" })) : undefined, styles: type === "heading" ? { "font-size": "48px" } : type === "divider" ? { border: "0", "border-top": "1px solid currentColor", margin: "24px 0" } : ["section", "header", "footer"].includes(type) ? { padding: "48px 24px", "min-height": "180px", border: "1px solid currentColor", position: "relative", width: "100%" } : type === "gallery" ? { width: "100%", padding: "24px" } : type === "image" ? { width: "100%", "max-width": "900px", height: "auto" } : {} };
    onChange({ ...settings, customElements: [...settings.customElements, item] });
  }
  return <div className="builder-insert-panel">
    <p>Insert {selected ? `near “${selected.label.slice(0, 45)}”` : "below the first section"}. Select a section to choose another location.</p>
    <label>Placement<select value={placement} onChange={(event) => setPlacement(event.target.value as typeof placement)}><option value="after">After selection</option><option value="before">Before selection</option><option value="inside">Inside selected area</option></select></label>
    <div className="builder-insert-tools">
      <button onClick={() => insert("text")}>Text box</button><button onClick={() => insert("heading")}>Heading</button>
      <button onClick={() => onMedia((url) => insert("image", 1, url))}>Image</button><button onClick={() => { const url = window.prompt("YouTube, Vimeo, or another embed URL"); if (url) insert("embed", 1, url); }}>Video / embed</button>
      <button onClick={() => insert("button")}>Button / link</button><button onClick={() => insert("divider")}>Divider / line</button>
      <button onClick={() => insert("section")}>Section / boundary</button><button onClick={() => insert("spacer")}>Spacer</button>
      <button onClick={() => insert("header")}>Header section</button><button onClick={() => insert("footer")}>Footer section</button>
    </div>
    <h3>Image layouts</h3><label className="builder-check"><input type="checkbox" checked={withText} onChange={(event) => setWithText(event.target.checked)}/> Include editable heading and body</label>
    <div className="builder-layout-library">{[1, 2, 3, 4, 5].map((count) => <button key={count} onClick={() => insert("gallery", count)}><span className="builder-layout-diagram" style={{ gridTemplateColumns: `repeat(${count},1fr)` }}>{Array.from({ length: count }, (_, index) => <span key={index}><i/>{withText && <><b/><b/></>}</span>)}</span><strong>{count} image{count > 1 ? "s" : ""}{withText ? " + text" : ""}</strong></button>)}</div>
    <h3>Selected area background</h3><p>Choose a section or component first, then add its background.</p><label>Background color<input type="color" disabled={!selected || selected.locked} onChange={(event) => onBackground({ "background-color": event.target.value })}/></label><button disabled={!selected || selected.locked} onClick={() => onMedia((url) => onBackground({ "background-image": `url("${url}")`, "background-size": "cover", "background-position": "center" }))}>Choose background image</button>
    <h3>Pages and navigation</h3><button onClick={onPage}>Create a new page</button>
    <label>New navigation tab<input value={tabLabel} onChange={(event) => setTabLabel(event.target.value)} placeholder="Tab label"/></label><label>Tab link<input value={tabUrl} onChange={(event) => setTabUrl(event.target.value)} placeholder="/page or https://…"/></label>
    <button disabled={!tabLabel.trim() || !tabUrl.trim()} onClick={() => { onChange({ ...settings, navigationLinks: [...(settings.navigationLinks || []), { label: tabLabel.trim(), href: tabUrl.trim() }] }); setTabLabel(""); setTabUrl(""); }}>Add navigation tab</button>
  </div>;
}
