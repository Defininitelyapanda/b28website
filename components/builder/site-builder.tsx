"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Copy, ExternalLink, FileText, Laptop, Monitor, Plus, Redo2, Save, Search, Send, Smartphone, Trash2, Undo2, Upload, X } from "lucide-react";
import type { ContentBlock, ContentItem, ContentStatus, ContentType } from "@/lib/cms-types";
import { contentPath } from "@/lib/content-url";

type Draft = {
  id?: string;
  type: ContentType;
  slug: string;
  title: string;
  status: ContentStatus;
  excerpt: string;
  body: string;
  coverImage: string;
  featured: boolean;
  sortOrder: number;
  data: Record<string, unknown>;
  blocks: ContentBlock[];
};

type Viewport = "desktop" | "tablet" | "mobile";
type PreviewMode = "design" | "site";

const typeLabels: Record<ContentType, string> = { page: "Page", project: "Project", article: "Journal", service: "Service", team: "Team" };
const typeDescriptions: Record<ContentType, string> = {
  page: "Create a standalone page and add it to navigation.",
  project: "Add a film to the Projects archive.",
  article: "Publish a journal story under About.",
  service: "Add a capability to the Services page.",
  team: "Add a profile to the About page.",
};
const publicPages = [["Home", "/"], ["Projects", "/work"], ["About", "/about"], ["Services", "/services"], ["Journal", "/journal"], ["Contact", "/contact"]] as const;

function freshDraft(type: ContentType = "page"): Draft {
  return { type, slug: "", title: "", status: "draft", excerpt: "", body: "", coverImage: "", featured: false, sortOrder: 0, data: {}, blocks: [] };
}

function fromItem(item: ContentItem): Draft {
  return { ...item, coverImage: item.coverImage || "", blocks: Array.isArray(item.data.blocks) ? item.data.blocks as ContentBlock[] : [] };
}

function slugify(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function blockLabel(type: ContentBlock["type"]) {
  return ({ text: "Text", quote: "Quote", image: "Image", video: "Video", gallery: "Gallery", stats: "Statistics", timeline: "Timeline", cta: "Button" } as const)[type];
}

export function SiteBuilder({ initial }: { initial: ContentItem[] }) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<Draft[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [query, setQuery] = useState("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("site");
  const [previewPath, setPreviewPath] = useState("/");
  const [previewKey, setPreviewKey] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => items.filter((item) => (filter === "all" || item.type === filter) && `${item.title} ${item.slug}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [items, filter, query]);

  useEffect(() => {
    if (!draft) return;
    const timer = window.setTimeout(() => localStorage.setItem("b28-builder-draft", JSON.stringify(draft)), 500);
    return () => window.clearTimeout(timer);
  }, [draft]);

  function select(item: ContentItem) {
    const next = fromItem(item);
    setDraft(next); setHistory([next]); setHistoryIndex(0); setPreviewPath(contentPath(item.type, item.slug)); setPreviewMode("design"); setStatus(`${typeLabels[item.type]} selected`);
  }

  function create(type: ContentType) {
    const next = freshDraft(type);
    setDraft(next); setHistory([next]); setHistoryIndex(0); setPreviewMode("design"); setShowCreate(false); setStatus(`New ${typeLabels[type].toLocaleLowerCase()}`);
  }

  function commit(next: Draft) {
    const nextHistory = [...history.slice(0, historyIndex + 1), next].slice(-80);
    setDraft(next); setHistory(nextHistory); setHistoryIndex(nextHistory.length - 1); setStatus("Unsaved changes");
  }

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    if (!draft) return;
    commit({ ...draft, [key]: value });
  }

  function titleField(value: string) {
    if (!draft) return;
    const previousAutoSlug = slugify(draft.title);
    commit({ ...draft, title: value, slug: !draft.slug || draft.slug === previousAutoSlug ? slugify(value) : draft.slug });
  }

  function dataField(key: string, value: unknown) {
    if (!draft) return;
    commit({ ...draft, data: { ...draft.data, [key]: value } });
  }

  function undo() {
    if (historyIndex <= 0) return;
    const index = historyIndex - 1; setHistoryIndex(index); setDraft(history[index]); setStatus("Change undone");
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const index = historyIndex + 1; setHistoryIndex(index); setDraft(history[index]); setStatus("Change restored");
  }

  function addBlock(type: ContentBlock["type"]) {
    if (!draft) return;
    const block: ContentBlock = { id: crypto.randomUUID(), type, order: draft.blocks.length, data: { text: "" } };
    commit({ ...draft, blocks: [...draft.blocks, block] });
  }

  function updateBlock(id: string, data: Partial<ContentBlock>) {
    if (!draft) return;
    commit({ ...draft, blocks: draft.blocks.map((block) => block.id === id ? { ...block, ...data } : block) });
  }

  function moveBlock(index: number, movement: number) {
    if (!draft) return;
    const target = index + movement;
    if (target < 0 || target >= draft.blocks.length) return;
    const blocks = [...draft.blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    commit({ ...draft, blocks: blocks.map((block, order) => ({ ...block, order })) });
  }

  function removeBlock(id: string) {
    if (!draft) return;
    commit({ ...draft, blocks: draft.blocks.filter((block) => block.id !== id).map((block, order) => ({ ...block, order })) });
  }

  async function save(statusValue: ContentStatus) {
    if (!draft || !draft.title || !draft.slug) { setStatus("Add a title and URL slug first"); return; }
    setSaving(true); setStatus(statusValue === "published" ? "Publishing…" : "Saving…");
    try {
      const response = await fetch("/api/admin2714/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, status: statusValue, data: { ...draft.data, blocks: draft.blocks }, scheduledAt: null, changeSummary: statusValue === "published" ? "Published from visual builder" : "Saved from visual builder" }) });
      const result = await response.json() as { success: boolean; data?: ContentItem; publicPath?: string; error?: { message?: string } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error?.message || "Save failed.");
      const saved = fromItem(result.data);
      setItems((current) => [result.data!, ...current.filter((item) => item.id !== result.data!.id)]);
      setDraft(saved); setHistory([saved]); setHistoryIndex(0); localStorage.removeItem("b28-builder-draft");
      setPreviewPath(result.publicPath || contentPath(saved.type, saved.slug)); setPreviewKey((key) => key + 1); setPreviewMode("site");
      setStatus(statusValue === "published" ? "Published — live preview refreshed" : "Draft saved");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Save failed"); }
    finally { setSaving(false); }
  }

  function duplicate() {
    if (!draft) return;
    const next = { ...draft, id: undefined, title: `${draft.title} copy`, slug: `${draft.slug || "item"}-copy`, status: "draft" as const, publishedAt: undefined, createdAt: undefined, updatedAt: undefined } as Draft;
    setDraft(next); setHistory([next]); setHistoryIndex(0); setPreviewMode("design"); setStatus("Copy created — save when ready");
  }

  async function remove() {
    if (!draft?.id || !window.confirm(`Delete “${draft.title}”? This removes it from the public site.`)) return;
    setSaving(true); setStatus("Deleting…");
    try {
      const response = await fetch(`/api/admin2714/content?id=${encodeURIComponent(draft.id)}`, { method: "DELETE" });
      const result = await response.json() as { success: boolean; error?: { message?: string } };
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Delete failed.");
      setItems((current) => current.filter((item) => item.id !== draft.id)); setDraft(null); setHistory([]); setHistoryIndex(-1); setPreviewPath("/"); setPreviewKey((key) => key + 1); setPreviewMode("site"); setStatus("Item deleted");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Delete failed"); }
    finally { setSaving(false); }
  }

  async function upload(file: File) {
    setSaving(true); setStatus("Uploading media…");
    try {
      const form = new FormData(); form.set("file", file); form.set("altText", draft?.title || file.name);
      const response = await fetch("/api/admin2714/media", { method: "POST", body: form });
      const result = await response.json() as { success: boolean; data?: { key: string }; error?: { message?: string } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error?.message || "Upload failed.");
      field("coverImage", result.data.key); setStatus("Media uploaded and selected");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed"); }
    finally { setSaving(false); if (uploadRef.current) uploadRef.current.value = ""; }
  }

  function openPublic(path: string) {
    setPreviewPath(path); setPreviewMode("site"); setPreviewKey((key) => key + 1); setStatus(`Previewing ${path === "/" ? "home" : path}`);
  }

  return <div className="builder-shell">
    <header className="builder-toolbar">
      <div className="builder-brand"><Link href="/" aria-label="Return to public site"><ArrowLeft size={17}/></Link><span className="builder-logo">B28</span><div><strong>Website Builder</strong><small>{status}</small></div></div>
      <div className="builder-toolbar-center"><button className={previewMode === "design" ? "active" : ""} onClick={() => setPreviewMode("design")} disabled={!draft}>Design</button><button className={previewMode === "site" ? "active" : ""} onClick={() => setPreviewMode("site")}>Live site</button><span className="builder-divider"/><button aria-label="Desktop preview" className={viewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")}><Monitor size={16}/></button><button aria-label="Tablet preview" className={viewport === "tablet" ? "active" : ""} onClick={() => setViewport("tablet")}><Laptop size={16}/></button><button aria-label="Mobile preview" className={viewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")}><Smartphone size={16}/></button></div>
      <div className="builder-toolbar-actions"><button aria-label="Undo" onClick={undo} disabled={historyIndex <= 0}><Undo2 size={16}/></button><button aria-label="Redo" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo2 size={16}/></button><button onClick={() => void save("draft")} disabled={!draft || saving}><Save size={15}/> Draft</button><button className="primary" onClick={() => void save("published")} disabled={!draft || saving}><Send size={15}/> Publish</button></div>
    </header>

    <aside className="builder-left">
      <div className="builder-side-heading"><div><small>Website</small><strong>Pages & content</strong></div><button aria-label="Add content" onClick={() => setShowCreate(!showCreate)}><Plus size={17}/></button></div>
      {showCreate && <div className="builder-create-menu">{(Object.keys(typeLabels) as ContentType[]).map((type) => <button key={type} onClick={() => create(type)}><strong>{typeLabels[type]}</strong><span>{typeDescriptions[type]}</span></button>)}</div>}
      <nav className="builder-public-pages" aria-label="Public pages">{publicPages.map(([label, path]) => <button key={path} className={previewPath === path && previewMode === "site" ? "active" : ""} onClick={() => openPublic(path)}><FileText size={15}/><span>{label}</span><small>{path}</small></button>)}</nav>
      <div className="builder-library-heading"><strong>Managed content</strong><span>{items.length}</span></div>
      <label className="builder-search"><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search"/></label>
      <div className="builder-filter">{(["all", "page", "project", "article", "service", "team"] as const).map((type) => <button className={filter === type ? "active" : ""} key={type} onClick={() => setFilter(type)}>{type === "all" ? "All" : typeLabels[type]}</button>)}</div>
      <div className="builder-items">{visible.map((item) => <button key={item.id} className={draft?.id === item.id ? "active" : ""} onClick={() => select(item)}><span className={`builder-type type-${item.type}`}>{typeLabels[item.type].slice(0, 1)}</span><span><strong>{item.title}</strong><small>/{item.slug} · {item.status}</small></span></button>)}{!visible.length && <p>No matching content.</p>}</div>
    </aside>

    <main className="builder-canvas">
      <div className={`builder-device ${viewport}`}>
        {previewMode === "site" ? <iframe key={`${previewPath}-${previewKey}`} src={previewPath} title={`Preview of ${previewPath}`}/> : draft ? <DraftPreview draft={draft}/> : <div className="builder-empty"><FileText size={32}/><h2>Select something to edit</h2><p>Choose a page or content item from the left, or create a new one.</p></div>}
      </div>
    </main>

    <aside className="builder-inspector">
      {!draft ? <div className="builder-inspector-empty"><strong>Nothing selected</strong><p>Select managed content to edit its design and information.</p></div> : <>
        <div className="builder-inspector-head"><div><small>{draft.id ? "Editing" : "Creating"}</small><strong>{draft.title || `New ${typeLabels[draft.type]}`}</strong></div><button aria-label="Close editor" onClick={() => { setDraft(null); setPreviewMode("site"); }}><X size={17}/></button></div>
        <div className="builder-inspector-actions"><button onClick={duplicate}><Copy size={14}/> Duplicate</button>{draft.status === "published" && draft.slug && <a href={contentPath(draft.type, draft.slug)} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Open</a>}<button className="danger" onClick={() => void remove()} disabled={!draft.id || saving}><Trash2 size={14}/> Delete</button></div>
        <div className="builder-fields">
          <label>Content type<select value={draft.type} onChange={(event) => field("type", event.target.value as ContentType)}>{(Object.keys(typeLabels) as ContentType[]).map((type) => <option value={type} key={type}>{typeLabels[type]}</option>)}</select></label>
          <label>Title<input value={draft.title} onChange={(event) => titleField(event.target.value)} placeholder="Give it a clear title"/></label>
          <label>URL slug<div className="builder-slug"><span>/</span><input value={draft.slug} onChange={(event) => field("slug", slugify(event.target.value))}/></div></label>
          <label>Short description<textarea value={draft.excerpt} onChange={(event) => field("excerpt", event.target.value)} placeholder="Used on cards and search results"/></label>
          <label>Main content<textarea className="builder-body-input" value={draft.body} onChange={(event) => field("body", event.target.value)} placeholder="Write the main story here…"/></label>
          <label>Cover image<div className="builder-media-field"><input value={draft.coverImage} onChange={(event) => field("coverImage", event.target.value)} placeholder="/media/image.jpg"/><button type="button" onClick={() => uploadRef.current?.click()}><Upload size={14}/></button><input ref={uploadRef} className="sr-only" type="file" accept="image/*,video/mp4,video/webm" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }}/></div></label>
          <TypeFields draft={draft} setData={dataField}/>
          <label className="builder-check"><input type="checkbox" checked={draft.featured} onChange={(event) => field("featured", event.target.checked)}/> Feature this item prominently</label>
        </div>
        <div className="builder-blocks"><div className="builder-section-title"><div><small>Layout</small><strong>Content blocks</strong></div></div><div className="builder-block-palette">{(["text", "image", "quote", "video", "cta", "gallery", "stats", "timeline"] as ContentBlock["type"][]).map((type) => <button key={type} onClick={() => addBlock(type)}><Plus size={12}/>{blockLabel(type)}</button>)}</div>{draft.blocks.map((block, index) => <div className="builder-block" key={block.id}><div className="builder-block-head"><strong>{blockLabel(block.type)}</strong><span><button disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label="Move block up"><ChevronUp size={14}/></button><button disabled={index === draft.blocks.length - 1} onClick={() => moveBlock(index, 1)} aria-label="Move block down"><ChevronDown size={14}/></button><button onClick={() => removeBlock(block.id)} aria-label="Delete block"><Trash2 size={14}/></button></span></div><textarea value={String(block.data.text || "")} placeholder={["image", "video", "cta"].includes(block.type) ? "URL or file path" : "Block content"} onChange={(event) => updateBlock(block.id, { data: { ...block.data, text: event.target.value } })}/>{["image", "video", "cta"].includes(block.type) && <input value={String(block.data.label || block.data.alt || "")} placeholder={block.type === "image" ? "Image description" : "Label"} onChange={(event) => updateBlock(block.id, { data: { ...block.data, ...(block.type === "image" ? { alt: event.target.value } : { label: event.target.value }) } })}/>}</div>)}</div>
      </>}
    </aside>
  </div>;
}

function TypeFields({ draft, setData }: { draft: Draft; setData: (key: string, value: unknown) => void }) {
  if (draft.type === "project") return <div className="builder-type-fields"><label>Year<input value={String(draft.data.year || "")} onChange={(event) => setData("year", event.target.value)}/></label><label>Format<input value={String(draft.data.format || "")} onChange={(event) => setData("format", event.target.value)}/></label><label>Genre<input value={String(draft.data.genre || "")} onChange={(event) => setData("genre", event.target.value)}/></label><label>Runtime<input value={String(draft.data.runtime || "")} onChange={(event) => setData("runtime", event.target.value)}/></label><label className="wide">Film URL<input value={String(draft.data.youtubeUrl || "")} onChange={(event) => setData("youtubeUrl", event.target.value)}/></label><label className="wide">Trailer URL<input value={String(draft.data.trailerUrl || "")} onChange={(event) => setData("trailerUrl", event.target.value)}/></label><label className="wide">Credits, one per line<textarea value={Array.isArray(draft.data.credits) ? draft.data.credits.join("\n") : ""} onChange={(event) => setData("credits", event.target.value.split(/\r?\n/).filter(Boolean))}/></label></div>;
  if (draft.type === "article") return <div className="builder-type-fields"><label>Category<input value={String(draft.data.category || "")} onChange={(event) => setData("category", event.target.value)}/></label><label>Author<input value={String(draft.data.author || "")} onChange={(event) => setData("author", event.target.value)}/></label></div>;
  if (draft.type === "page") return <div className="builder-type-fields"><label>Kicker<input value={String(draft.data.kicker || "")} onChange={(event) => setData("kicker", event.target.value)}/></label><label>Image description<input value={String(draft.data.imageAlt || "")} onChange={(event) => setData("imageAlt", event.target.value)}/></label></div>;
  if (draft.type === "team") return <label>Role<input value={String(draft.data.role || "")} onChange={(event) => setData("role", event.target.value)}/></label>;
  return <label>Service label<input value={String(draft.data.label || "")} onChange={(event) => setData("label", event.target.value)}/></label>;
}

function DraftPreview({ draft }: { draft: Draft }) {
  return <div className="builder-draft-preview"><header><div className="builder-preview-nav"><strong>B28 ENTERTAINMENT</strong><span>PROJECTS　 ABOUT　 SERVICES　 CONTACT</span></div><div className="builder-preview-hero" style={draft.coverImage ? { backgroundImage: `linear-gradient(90deg,rgba(5,7,8,.88),rgba(5,7,8,.25)),url("${draft.coverImage.replace(/["\\]/g, "")}")` } : undefined}><div><small>{String(draft.data.kicker || draft.data.category || draft.data.format || typeLabels[draft.type])}</small><h1>{draft.title || "Untitled"}</h1><p>{draft.excerpt || "Add a short description in the editor."}</p></div></div></header><article><p>{draft.body || "Your main content will appear here."}</p>{draft.blocks.filter((block) => !block.hidden).sort((a, b) => a.order - b.order).map((block) => <section className={`preview-block ${block.type}`} key={block.id}><small>{blockLabel(block.type)}</small>{block.type === "image" ? <div className="preview-image" style={{ backgroundImage: `url("${String(block.data.text || "").replace(/["\\]/g, "")}")` }}/>: block.type === "cta" ? <button>{String(block.data.label || "Call to action")}</button> : <p>{String(block.data.text || `Add ${blockLabel(block.type).toLocaleLowerCase()} content`)}</p>}</section>)}</article></div>;
}
